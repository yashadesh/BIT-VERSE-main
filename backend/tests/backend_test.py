"""BITVERSE Backend API tests.

Covers:
- Meta endpoints (/api/, /api/stats)
- Subjects & Modules
- File upload (notes, PYQ, syllabus), listing filters, view/download, delete (soft)
- Resources CRUD
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://first-year-vault.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SMALL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def created_ids():
    """Registry for cleanup."""
    return {"subjects": [], "modules": [], "files": [], "resources": []}


# ── Meta ─────────────────────────────────────────────────────────────────────
class TestMeta:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["app"] == "BITVERSE"
        assert "tagline" in data

    def test_stats(self, session):
        r = session.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("notes", "pyqs", "subjects", "students"):
            assert k in d
        assert d["subjects"] >= 20


# ── Subjects & Modules ───────────────────────────────────────────────────────
class TestSubjects:
    def test_list_all(self, session):
        r = session.get(f"{API}/subjects")
        assert r.status_code == 200
        subs = r.json()
        assert isinstance(subs, list)
        assert len(subs) >= 20

    def test_list_sem1(self, session):
        r = session.get(f"{API}/subjects", params={"semester": 1})
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) == 10
        assert all(s["semester"] == 1 for s in subs)

    def test_list_sem2(self, session):
        r = session.get(f"{API}/subjects", params={"semester": 2})
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) == 10
        assert all(s["semester"] == 2 for s in subs)

    def test_modules_for_subject(self, session):
        subs = session.get(f"{API}/subjects", params={"semester": 1}).json()
        sub_id = subs[0]["id"]
        r = session.get(f"{API}/subjects/{sub_id}/modules")
        assert r.status_code == 200
        mods = r.json()
        assert len(mods) == 5

    def test_create_and_delete_subject_cascade(self, session, created_ids):
        # create subject
        r = session.post(f"{API}/subjects", data={"name": "TEST_Subject", "semester": 1, "credits": 3})
        assert r.status_code == 200
        sub = r.json()
        assert sub["name"] == "TEST_Subject"
        sub_id = sub["id"]

        # verify via GET
        g = session.get(f"{API}/subjects/{sub_id}")
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_Subject"

        # create module
        rm = session.post(f"{API}/modules", data={"subject_id": sub_id, "name": "TEST_Module"})
        assert rm.status_code == 200
        mod = rm.json()
        assert mod["subject_id"] == sub_id

        # list modules
        lm = session.get(f"{API}/subjects/{sub_id}/modules")
        assert lm.status_code == 200
        assert any(m["id"] == mod["id"] for m in lm.json())

        # cascade delete
        d = session.delete(f"{API}/subjects/{sub_id}")
        assert d.status_code == 200

        # verify subject gone
        g2 = session.get(f"{API}/subjects/{sub_id}")
        assert g2.status_code == 404


# ── File Uploads ─────────────────────────────────────────────────────────────
class TestFileUploads:
    @pytest.fixture(scope="class")
    def sem1_subject_module(self, session):
        subs = session.get(f"{API}/subjects", params={"semester": 1}).json()
        sub = subs[0]
        mods = session.get(f"{API}/subjects/{sub['id']}/modules").json()
        return sub, mods[0]

    def _upload(self, session, category, extra=None, fname="test.pdf"):
        files = {"file": (fname, io.BytesIO(SMALL_PDF), "application/pdf")}
        data = {"category": category, "display_name": f"TEST_{category}"}
        if extra:
            data.update(extra)
        r = session.post(f"{API}/upload", files=files, data=data)
        return r

    def test_upload_notes(self, session, sem1_subject_module, created_ids):
        sub, mod = sem1_subject_module
        r = self._upload(session, "notes", {"subject_id": sub["id"], "module_id": mod["id"]})
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        f = r.json()
        assert f["category"] == "notes"
        assert f["module_id"] == mod["id"]
        created_ids["files"].append(f["id"])

        # verify listed under module
        lst = session.get(f"{API}/files", params={"module_id": mod["id"]}).json()
        assert any(x["id"] == f["id"] for x in lst)

    def test_upload_pyq_and_filter(self, session, sem1_subject_module, created_ids):
        sub, _ = sem1_subject_module
        for t in ["mid", "end", "solution"]:
            r = self._upload(session, "pyq", {"subject_id": sub["id"], "pyq_type": t}, fname=f"pyq_{t}.pdf")
            assert r.status_code == 200
            created_ids["files"].append(r.json()["id"])

        # filter by pyq_type
        lst = session.get(f"{API}/files", params={"category": "pyq", "subject_id": sub["id"], "pyq_type": "mid"}).json()
        assert all(x["pyq_type"] == "mid" for x in lst)
        assert len(lst) >= 1

    def test_upload_syllabus(self, session, created_ids):
        r = self._upload(session, "syllabus", {"semester": 1}, fname="syllabus1.pdf")
        assert r.status_code == 200
        fid = r.json()["id"]
        created_ids["files"].append(fid)

        lst = session.get(f"{API}/files", params={"category": "syllabus", "semester": 1}).json()
        assert any(x["id"] == fid for x in lst)

    def test_view_and_download(self, session, created_ids):
        assert created_ids["files"], "no file uploaded"
        fid = created_ids["files"][0]

        rv = session.get(f"{API}/files/{fid}/view")
        assert rv.status_code == 200
        assert "inline" in rv.headers.get("Content-Disposition", "")
        assert rv.content.startswith(b"%PDF")

        rd = session.get(f"{API}/files/{fid}/download")
        assert rd.status_code == 200
        assert "attachment" in rd.headers.get("Content-Disposition", "")

    def test_soft_delete(self, session, created_ids):
        # Upload a fresh one to delete
        r = self._upload(session, "notes", {"subject_id": None, "module_id": None}, fname="tobe_deleted.pdf")
        assert r.status_code == 200
        fid = r.json()["id"]

        d = session.delete(f"{API}/files/{fid}")
        assert d.status_code == 200

        # should not appear in listing
        lst = session.get(f"{API}/files", params={"category": "notes"}).json()
        assert not any(x["id"] == fid for x in lst)

        # detail should 404 (is_deleted filter applied)
        gm = session.get(f"{API}/files/{fid}")
        assert gm.status_code == 404


# ── Resources ────────────────────────────────────────────────────────────────
class TestResources:
    def test_create_list_delete_resource(self, session, created_ids):
        r = session.post(f"{API}/resources", data={
            "title": "TEST_YouTube",
            "url": "https://youtu.be/test",
            "resource_type": "youtube",
            "description": "test",
        })
        assert r.status_code == 200
        res = r.json()
        assert res["title"] == "TEST_YouTube"
        assert res["resource_type"] == "youtube"
        rid = res["id"]

        # list filtered
        lst = session.get(f"{API}/resources", params={"resource_type": "youtube"}).json()
        assert any(x["id"] == rid for x in lst)

        # delete
        d = session.delete(f"{API}/resources/{rid}")
        assert d.status_code == 200

        # verify gone
        lst2 = session.get(f"{API}/resources", params={"resource_type": "youtube"}).json()
        assert not any(x["id"] == rid for x in lst2)


# ── Cleanup ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def _cleanup(created_ids):
    yield
    s = requests.Session()
    for fid in created_ids["files"]:
        try:
            s.delete(f"{API}/files/{fid}", timeout=15)
        except Exception:
            pass
