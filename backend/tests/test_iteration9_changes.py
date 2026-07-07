"""Iteration 9 tests: PT removal, new credits, live tracker, gzip, indexes, drive viewer."""
import os
import time
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://first-year-vault.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# -------- Fixtures --------
@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    return s

@pytest.fixture(scope="module")
def admin_token(api_client):
    email = os.environ.get("ADMIN_EMAIL", "yashadesh.13@gmail.com")
    password = os.environ.get("ADMIN_PASSWORD", "Adesh@Bitverse2026")
    r = api_client.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]

@pytest.fixture(scope="module")
def subjects(api_client):
    r = api_client.get(f"{API}/subjects")
    assert r.status_code == 200
    return r.json()

# -------- PT and Games removal + subject count --------
class TestSubjectsAndPTRemoval:
    def test_total_subject_count_is_19(self, subjects):
        assert len(subjects) == 19, f"Expected 19 subjects, got {len(subjects)}"

    def test_no_pt_and_games(self, subjects):
        names = [s["name"] for s in subjects]
        assert "PT and Games" not in names, f"PT and Games still present: {names}"

    def test_sem1_count_is_10(self, subjects):
        s1 = [s for s in subjects if s["semester"] == 1]
        assert len(s1) == 10, f"Expected 10 Sem1 subjects, got {len(s1)}: {[x['name'] for x in s1]}"

    def test_sem2_count_is_9(self, subjects):
        s2 = [s for s in subjects if s["semester"] == 2]
        assert len(s2) == 9, f"Expected 9 Sem2 subjects, got {len(s2)}"

# -------- Credits per new spec --------
EXPECTED_CREDITS = {
    # Sem1
    "Environmental Science": 2,
    "Chemistry": 4,
    "Chemistry Lab": 1,
    "Basic Electronics": 3,
    "Basic Electronics Lab": 1,
    "Mathematics-I": 4,
    "Basics of Mechanical Engineering": 3,
    "Engineering Graphics": 2,
    "Workshop Practice": 1,
    "NSS": 1,
    # Sem2
    "Biological Science for Engineers": 2,
    "Programming for Problem Solving": 4,
    "Programming for Problem Solving Laboratory": 1,
    "Basics of Electrical Engineering": 3,
    "Electrical Engineering Lab": 1,
    "Communication Skill-I": 1.5,
    "Mathematics-II": 4,
    "Physics": 4,
    "Physics Lab": 1,
}

class TestCredits:
    def test_all_subject_credits_match_spec(self, subjects):
        by_name = {s["name"]: s for s in subjects}
        mismatches = []
        for name, expected in EXPECTED_CREDITS.items():
            if name not in by_name:
                mismatches.append(f"MISSING: {name}")
                continue
            actual = by_name[name].get("credits")
            if actual != expected:
                mismatches.append(f"{name}: expected {expected}, got {actual}")
        assert not mismatches, "Credit mismatches: " + "; ".join(mismatches)

    def test_sem1_total_credits_is_22(self, subjects):
        total = sum((s.get("credits") or 0) for s in subjects if s["semester"] == 1)
        assert total == 22, f"Sem1 total credits {total} != 22"

    def test_sem2_total_credits_is_21_5(self, subjects):
        total = sum((s.get("credits") or 0) for s in subjects if s["semester"] == 2)
        assert total == 21.5, f"Sem2 total credits {total} != 21.5"

# -------- Live tracker on real server load --------
class TestLiveTrackerRealLoad:
    def test_view_and_download_increment_stats(self, api_client, admin_token, subjects):
        # Find Physics and Chemistry
        physics = next((s for s in subjects if s["name"] == "Physics"), None)
        chemistry = next((s for s in subjects if s["name"] == "Chemistry"), None)
        assert physics and chemistry

        # Upload a small test file for each subject to enable view/download
        headers = {"Authorization": f"Bearer {admin_token}"}

        def upload(subject_id, tag):
            files = {"file": (f"TEST_{tag}.txt", b"hello world " * 20, "text/plain")}
            data = {"category": "notes", "subject_id": subject_id, "display_name": f"TEST_{tag}"}
            r = api_client.post(f"{API}/upload", headers=headers, files=files, data=data)
            assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text}"
            return r.json()["id"]

        phys_file = upload(physics["id"], "phys_iter9")
        chem_file = upload(chemistry["id"], "chem_iter9")

        # Read initial trending
        r0 = api_client.get(f"{API}/analytics/trending?limit=20")
        assert r0.status_code == 200
        init = {row["subject_id"]: row for row in r0.json()["trending"]}
        phys_v0 = init.get(physics["id"], {}).get("views", 0)
        chem_d0 = init.get(chemistry["id"], {}).get("downloads", 0)

        # 3 views on physics
        for _ in range(3):
            rv = api_client.get(f"{API}/files/{phys_file}/view")
            assert rv.status_code == 200

        # 2 downloads on chemistry
        for _ in range(2):
            rd = api_client.get(f"{API}/files/{chem_file}/download")
            assert rd.status_code == 200

        time.sleep(0.5)  # give MongoDB a tick

        r1 = api_client.get(f"{API}/analytics/trending?limit=20")
        assert r1.status_code == 200
        after = {row["subject_id"]: row for row in r1.json()["trending"]}
        phys_v1 = after.get(physics["id"], {}).get("views", 0)
        chem_d1 = after.get(chemistry["id"], {}).get("downloads", 0)

        assert phys_v1 - phys_v0 >= 3, f"Physics views did not increment by 3 (before={phys_v0}, after={phys_v1})"
        assert chem_d1 - chem_d0 >= 2, f"Chemistry downloads did not increment by 2 (before={chem_d0}, after={chem_d1})"

        # Cleanup test files
        api_client.delete(f"{API}/files/{phys_file}", headers=headers)
        api_client.delete(f"{API}/files/{chem_file}", headers=headers)

    def test_trending_sorted_by_score_desc(self, api_client):
        r = api_client.get(f"{API}/analytics/trending?limit=8")
        assert r.status_code == 200
        rows = r.json()["trending"]
        scores = [row["score"] for row in rows]
        assert scores == sorted(scores, reverse=True), "Trending not sorted by score desc"
        # Score = views + 2 * downloads
        for row in rows:
            expected = row["views"] + 2 * row["downloads"]
            assert row["score"] == expected, f"Score mismatch for {row['name']}: {row['score']} != {expected}"

    def test_trending_returns_at_most_limit(self, api_client):
        r = api_client.get(f"{API}/analytics/trending?limit=8")
        assert len(r.json()["trending"]) <= 8

# -------- GZip perf --------
class TestGzipAndPerformance:
    def test_subjects_gzip_encoding(self, api_client):
        r = api_client.get(f"{API}/subjects", headers={"Accept-Encoding": "gzip"})
        assert r.status_code == 200
        # requests auto-decompresses; check Content-Encoding header
        ce = r.headers.get("Content-Encoding", "")
        assert "gzip" in ce.lower(), f"content-encoding not gzip: {r.headers}"

    def test_subjects_fast_response(self, api_client):
        # Warmup
        api_client.get(f"{API}/subjects")
        t0 = time.time()
        r = api_client.get(f"{API}/subjects")
        elapsed = (time.time() - t0) * 1000
        assert r.status_code == 200
        assert elapsed < 1500, f"Subjects endpoint slow: {elapsed:.0f}ms"

# -------- MongoDB indexes --------
class TestMongoIndexes:
    def _get_indexes(self, collection):
        from dotenv import load_dotenv
        load_dotenv("/app/backend/.env", override=True)
        mongo_url = os.environ["MONGO_URL"].strip('"').strip("'")
        db_name = os.environ["DB_NAME"].strip('"').strip("'")

        async def run():
            client = AsyncIOMotorClient(mongo_url)
            db = client[db_name]
            idx = await db[collection].index_information()
            client.close()
            return idx

        return asyncio.get_event_loop().run_until_complete(run())

    def test_subjects_indexes(self):
        idx = self._get_indexes("subjects")
        keys = [tuple(v["key"]) for v in idx.values()]
        assert (("semester", 1), ("order", 1)) in keys, f"missing (semester,order): {keys}"
        assert (("name", 1),) in keys, f"missing name index: {keys}"

    def test_modules_indexes(self):
        idx = self._get_indexes("modules")
        keys = [tuple(v["key"]) for v in idx.values()]
        assert (("subject_id", 1), ("order", 1)) in keys

    def test_files_indexes(self):
        idx = self._get_indexes("files")
        keys = [tuple(v["key"]) for v in idx.values()]
        assert (("subject_id", 1), ("category", 1), ("is_deleted", 1)) in keys
        assert (("module_id", 1), ("is_deleted", 1)) in keys
        assert (("category", 1), ("is_deleted", 1)) in keys

    def test_subject_stats_unique_index(self):
        idx = self._get_indexes("subject_stats")
        # Look for unique index on subject_id
        found = False
        for name, spec in idx.items():
            if tuple(spec["key"]) == (("subject_id", 1),) and spec.get("unique"):
                found = True
        assert found, f"No unique index on subject_stats.subject_id: {idx}"

    def test_admin_user_unique_email(self):
        idx = self._get_indexes("admin_user")
        found = False
        for name, spec in idx.items():
            if tuple(spec["key"]) == (("email", 1),) and spec.get("unique"):
                found = True
        assert found, f"No unique index on admin_user.email: {idx}"

# -------- Auth regression --------
class TestAuthRegression:
    def test_admin_login_still_works(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={
            "email": "yashadesh.13@gmail.com",
            "password": "Adesh@Bitverse2026",
        })
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin"
        assert "token" in d

    def test_admin_login_invalid(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={
            "email": "yashadesh.13@gmail.com",
            "password": "wrong",
        })
        assert r.status_code == 401

    def test_protected_endpoint_requires_auth(self, api_client):
        r = api_client.post(f"{API}/modules", data={"subject_id": "x", "name": "y"})
        assert r.status_code == 401

# -------- Stats regression --------
class TestStats:
    def test_stats_endpoint(self, api_client):
        r = api_client.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        assert d["subjects"] == 19, f"stats.subjects != 19: {d}"
        assert "notes" in d and "pyqs" in d
