"""BITVERSE Backend - Premium Academic Library for BIT Mesra First Year
FastAPI + MongoDB + Emergent Object Storage
"""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Response, Query, Depends, Request
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import uuid
import logging
import mimetypes
import requests
import bcrypt
import jwt as pyjwt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ── Mongo ────────────────────────────────────────────────────────────────────
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ── Storage (Emergent Object Storage) ────────────────────────────────────────
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "bitverse")
_storage_key: Optional[str] = None

def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logging.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Object storage unavailable")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=180,
    )
    if resp.status_code == 403:
        # refresh key once
        globals()['_storage_key'] = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=180,
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Object storage unavailable")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=120,
    )
    if resp.status_code == 403:
        globals()['_storage_key'] = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key}, timeout=120,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="BITVERSE API")
api_router = APIRouter(prefix="/api")

# ── Auth ─────────────────────────────────────────────────────────────────────
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-env")
ADMIN_EMAIL = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD") or ""

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def _create_token(email: str, hours: int = 24) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def require_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth[7:]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if payload.get("role") != "admin" or payload.get("sub", "").lower() != ADMIN_EMAIL:
        raise HTTPException(403, "Admin only")
    return payload

class LoginBody(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def auth_login(body: LoginBody):
    email = (body.email or "").strip().lower()
    if not ADMIN_EMAIL or email != ADMIN_EMAIL:
        raise HTTPException(401, "Invalid credentials")
    admin = await db.admin_user.find_one({"email": ADMIN_EMAIL})
    if not admin or not _verify_password(body.password, admin.get("password_hash", "")):
        raise HTTPException(401, "Invalid credentials")
    token = _create_token(ADMIN_EMAIL)
    return {"token": token, "email": ADMIN_EMAIL, "role": "admin", "expires_in": 24 * 3600}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    payload = await require_admin(request)
    return {"email": payload["sub"], "role": payload.get("role", "admin")}

async def seed_admin():
    """Ensure the admin user exists and password matches env on every startup (idempotent)."""
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        logging.warning("ADMIN_EMAIL/ADMIN_PASSWORD not set — admin login disabled")
        return
    existing = await db.admin_user.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.admin_user.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": _hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logging.info("Admin seeded: %s", ADMIN_EMAIL)
    elif not _verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.admin_user.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": _hash_password(ADMIN_PASSWORD)}}
        )
        logging.info("Admin password rotated for %s", ADMIN_EMAIL)

# ── Models ───────────────────────────────────────────────────────────────────
class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    semester: int
    order: int = 0
    credits: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Module(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    name: str
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FileDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    storage_path: str
    original_filename: str
    display_name: str
    content_type: str
    size: int
    category: str  # 'notes' | 'pyq' | 'syllabus' | 'resource'
    subject_id: Optional[str] = None
    module_id: Optional[str] = None
    semester: Optional[int] = None
    pyq_type: Optional[str] = None  # 'mid' | 'end' | 'solution'
    resource_type: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ResourceLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    description: Optional[str] = ""
    resource_type: str  # 'book' | 'youtube' | 'coding' | 'semester' | 'link'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ── Seed ─────────────────────────────────────────────────────────────────────
SEM1_SUBJECTS = [
    ("Environmental Science", 2),
    ("Chemistry", 4),
    ("Chemistry Lab", 1),
    ("Basic Electronics", 3),
    ("Basic Electronics Lab", 1),
    ("Mathematics-I", 4),
    ("Basics of Mechanical Engineering", 3),
    ("Engineering Graphics", 2),
    ("Workshop Practice", 1),
    ("NSS", 1),
]
SEM2_SUBJECTS = [
    ("Biological Science for Engineers", 2),
    ("Programming for Problem Solving", 4),
    ("Programming for Problem Solving Laboratory", 1),
    ("Basics of Electrical Engineering", 3),
    ("Electrical Engineering Lab", 1),
    ("Communication Skill-I", 1.5),
    ("Mathematics-II", 4),
    ("Physics", 4),
    ("Physics Lab", 1),
]

# Subjects that no longer exist and should be purged on every startup
DEPRECATED_SUBJECTS = ["PT and Games"]

async def seed_if_empty():
    # Purge deprecated subjects on every startup (removes PT and Games + its modules/files)
    for dep_name in DEPRECATED_SUBJECTS:
        depr = await db.subjects.find_one({"name": dep_name})
        if depr:
            await db.modules.delete_many({"subject_id": depr["id"]})
            await db.files.update_many({"subject_id": depr["id"]}, {"$set": {"is_deleted": True}})
            await db.subject_stats.delete_many({"subject_id": depr["id"]})
            await db.subjects.delete_one({"_id": depr["_id"]})
            logging.info("Purged deprecated subject: %s", dep_name)

    count = await db.subjects.count_documents({})
    if count > 0:
        # Always sync credits to canonical values (idempotent)
        for sem, arr in [(1, SEM1_SUBJECTS), (2, SEM2_SUBJECTS)]:
            for name, credits in arr:
                await db.subjects.update_one(
                    {"name": name, "semester": sem},
                    {"$set": {"credits": credits}},
                )
        return
    logging.info("Seeding BITVERSE database...")
    for sem, arr in [(1, SEM1_SUBJECTS), (2, SEM2_SUBJECTS)]:
        for idx, (name, credits) in enumerate(arr):
            subj = Subject(name=name, semester=sem, order=idx, credits=credits)
            await db.subjects.insert_one(subj.model_dump())
            # 5 default modules per subject
            for m in range(1, 6):
                mod = Module(subject_id=subj.id, name=f"Module {m}", order=m)
                await db.modules.insert_one(mod.model_dump())
    logging.info("Seed complete.")

async def create_indexes():
    """Create MongoDB indexes for hot query paths."""
    try:
        await db.subjects.create_index([("semester", 1), ("order", 1)])
        await db.subjects.create_index("name")
        await db.modules.create_index([("subject_id", 1), ("order", 1)])
        await db.files.create_index([("subject_id", 1), ("category", 1), ("is_deleted", 1)])
        await db.files.create_index([("module_id", 1), ("is_deleted", 1)])
        await db.files.create_index([("category", 1), ("is_deleted", 1)])
        await db.files.create_index([("pyq_type", 1)])
        await db.subject_stats.create_index("subject_id", unique=True)
        await db.resources.create_index("resource_type")
        await db.admin_user.create_index("email", unique=True)
        logging.info("MongoDB indexes ready")
    except Exception as e:
        logging.warning("Index creation warning: %s", e)

# ── Routes: Meta ─────────────────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"app": "BITVERSE", "tagline": "The Digital Universe of BIT Mesra"}

@api_router.get("/stats")
async def stats():
    notes_count = await db.files.count_documents({"category": "notes", "is_deleted": False})
    pyqs_count = await db.files.count_documents({"category": "pyq", "is_deleted": False})
    subjects_count = await db.subjects.count_documents({})
    return {
        "notes": notes_count,
        "pyqs": pyqs_count,
        "subjects": subjects_count,
        "students": 1000,  # community estimate
    }

# ── Routes: Subjects & Modules ───────────────────────────────────────────────
@api_router.get("/subjects")
async def list_subjects(semester: Optional[int] = None):
    q = {}
    if semester is not None:
        q["semester"] = semester
    subs = await db.subjects.find(q, {"_id": 0}).sort("order", 1).to_list(500)
    return subs

@api_router.get("/subjects/{subject_id}")
async def get_subject(subject_id: str):
    s = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Subject not found")
    return s

@api_router.post("/subjects")
async def create_subject(name: str = Form(...), semester: int = Form(...), credits: Optional[float] = Form(None), _admin: dict = Depends(require_admin)):
    order = await db.subjects.count_documents({"semester": semester})
    subj = Subject(name=name, semester=semester, order=order, credits=credits)
    await db.subjects.insert_one(subj.model_dump())
    return subj.model_dump()

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, _admin: dict = Depends(require_admin)):
    await db.subjects.delete_one({"id": subject_id})
    await db.modules.delete_many({"subject_id": subject_id})
    await db.files.update_many({"subject_id": subject_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}

@api_router.get("/subjects/{subject_id}/modules")
async def list_modules(subject_id: str):
    mods = await db.modules.find({"subject_id": subject_id}, {"_id": 0}).sort("order", 1).to_list(200)
    return mods

@api_router.post("/modules")
async def create_module(subject_id: str = Form(...), name: str = Form(...), _admin: dict = Depends(require_admin)):
    order = await db.modules.count_documents({"subject_id": subject_id})
    mod = Module(subject_id=subject_id, name=name, order=order + 1)
    await db.modules.insert_one(mod.model_dump())
    return mod.model_dump()

@api_router.delete("/modules/{module_id}")
async def delete_module(module_id: str, _admin: dict = Depends(require_admin)):
    await db.modules.delete_one({"id": module_id})
    await db.files.update_many({"module_id": module_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}

@api_router.get("/modules/{module_id}")
async def get_module(module_id: str):
    m = await db.modules.find_one({"id": module_id}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Module not found")
    return m

# ── Routes: Files ────────────────────────────────────────────────────────────
def _guess_mime(filename: str, fallback: str = "application/octet-stream") -> str:
    mt, _ = mimetypes.guess_type(filename)
    return mt or fallback

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),
    display_name: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    module_id: Optional[str] = Form(None),
    semester: Optional[int] = Form(None),
    pyq_type: Optional[str] = Form(None),
    resource_type: Optional[str] = Form(None),
    _admin: dict = Depends(require_admin),
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/{category}/{file_id}.{ext}"
    data = await file.read()
    ct = file.content_type or _guess_mime(file.filename)
    result = put_object(path, data, ct)
    doc = FileDoc(
        id=file_id,
        storage_path=result["path"],
        original_filename=file.filename,
        display_name=display_name or file.filename,
        content_type=ct,
        size=result.get("size", len(data)),
        category=category,
        subject_id=subject_id,
        module_id=module_id,
        semester=semester,
        pyq_type=pyq_type,
        resource_type=resource_type,
    )
    await db.files.insert_one(doc.model_dump())
    return doc.model_dump()

@api_router.get("/files")
async def list_files(
    category: Optional[str] = None,
    subject_id: Optional[str] = None,
    module_id: Optional[str] = None,
    semester: Optional[int] = None,
    pyq_type: Optional[str] = None,
    resource_type: Optional[str] = None,
):
    q = {"is_deleted": False}
    if category:
        q["category"] = category
    if subject_id:
        q["subject_id"] = subject_id
    if module_id:
        q["module_id"] = module_id
    if semester is not None:
        q["semester"] = semester
    if pyq_type:
        q["pyq_type"] = pyq_type
    if resource_type:
        q["resource_type"] = resource_type
    files = await db.files.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return files

@api_router.get("/files/{file_id}")
async def get_file_meta(file_id: str):
    f = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not f:
        raise HTTPException(404, "File not found")
    return f

@api_router.patch("/files/{file_id}")
async def rename_file(file_id: str, display_name: str = Form(...), _admin: dict = Depends(require_admin)):
    r = await db.files.update_one({"id": file_id}, {"$set": {"display_name": display_name}})
    if r.matched_count == 0:
        raise HTTPException(404, "File not found")
    return {"ok": True}

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, _admin: dict = Depends(require_admin)):
    await db.files.update_one({"id": file_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}

@api_router.get("/files/{file_id}/view")
async def view_file(file_id: str):
    f = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not f:
        raise HTTPException(404, "File not found")
    data, ct = get_object(f["storage_path"])
    # track view (fire-and-forget increment)
    try:
        await db.files.update_one({"id": file_id}, {"$inc": {"view_count": 1}})
        if f.get("subject_id"):
            await db.subject_stats.update_one(
                {"subject_id": f["subject_id"]},
                {"$inc": {"views": 1}, "$set": {"last_activity": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
    except Exception:
        pass
    headers = {
        "Content-Disposition": f'inline; filename="{f["original_filename"]}"',
        "Cache-Control": "public, max-age=3600",
    }
    return Response(content=data, media_type=f.get("content_type", ct), headers=headers)

@api_router.get("/files/{file_id}/download")
async def download_file(file_id: str):
    f = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not f:
        raise HTTPException(404, "File not found")
    data, ct = get_object(f["storage_path"])
    try:
        await db.files.update_one({"id": file_id}, {"$inc": {"download_count": 1}})
        if f.get("subject_id"):
            await db.subject_stats.update_one(
                {"subject_id": f["subject_id"]},
                {"$inc": {"downloads": 1}, "$set": {"last_activity": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
    except Exception:
        pass
    headers = {
        "Content-Disposition": f'attachment; filename="{f["original_filename"]}"',
    }
    return Response(content=data, media_type=f.get("content_type", ct), headers=headers)

# ── Analytics / Trending ─────────────────────────────────────────────────────
@api_router.get("/analytics/trending")
async def analytics_trending(limit: int = 8):
    """Top subjects by combined views + downloads (weighted 1:2). Returns live tracker data.
    Falls back to seed-based deterministic values if there is no real activity yet, so the
    chart always looks alive on the home page.
    """
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(500)
    stats_map = {}
    async for s in db.subject_stats.find({}, {"_id": 0}):
        stats_map[s["subject_id"]] = s
    rows = []
    for s in subjects:
        st = stats_map.get(s["id"], {})
        views = int(st.get("views", 0))
        downloads = int(st.get("downloads", 0))
        score = views + downloads * 2
        rows.append({
            "subject_id": s["id"],
            "name": s["name"],
            "semester": s["semester"],
            "views": views,
            "downloads": downloads,
            "score": score,
        })

    # Real-time server load only — no demo values. Chart reflects actual usage.
    rows.sort(key=lambda x: x["score"], reverse=True)
    return {"trending": rows[:limit], "total_subjects": len(rows)}

# ── Routes: Resources ────────────────────────────────────────────────────────
@api_router.get("/resources")
async def list_resources(resource_type: Optional[str] = None):
    q = {}
    if resource_type:
        q["resource_type"] = resource_type
    r = await db.resources.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return r

@api_router.post("/resources")
async def create_resource(
    title: str = Form(...),
    url: str = Form(...),
    resource_type: str = Form(...),
    description: Optional[str] = Form(""),
    _admin: dict = Depends(require_admin),
):
    res = ResourceLink(title=title, url=url, description=description or "", resource_type=resource_type)
    await db.resources.insert_one(res.model_dump())
    return res.model_dump()

@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str, _admin: dict = Depends(require_admin)):
    await db.resources.delete_one({"id": resource_id})
    return {"ok": True}

# ── Lifecycle ────────────────────────────────────────────────────────────────
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
# backend/server.py

# ... find your existing FastAPI initialization scripts ...

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-atjz.onrender.com",
    "https://bitverse.co.in",
    "http://bitverse.co.in",
    "https://www.bitverse.co.in",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")
    await seed_admin()
    await seed_if_empty()
    await create_indexes()

@app.on_event("shutdown")
async def shutdown():
    client.close()
