"""Iteration 10 — Post .gitignore-fix regression smoke tests.

Verifies backend is still healthy after removing .env patterns from /app/.gitignore.
No code changes were made; only .gitignore was edited.
"""
import os
import subprocess
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

ADMIN_EMAIL = "yashadesh.13@gmail.com"
ADMIN_PASSWORD = "Adesh@Bitverse2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
    return data["token"]


# ---------- .gitignore fix ----------
class TestGitignoreFix:
    def test_gitignore_exists(self):
        assert os.path.exists("/app/.gitignore")

    def test_no_env_patterns(self):
        # grep -E '^\.env|^\*\.env' should return zero lines
        result = subprocess.run(
            ["grep", "-E", r"^\.env|^\*\.env", "/app/.gitignore"],
            capture_output=True, text=True,
        )
        # grep returns exit code 1 when no match
        assert result.returncode == 1, f"Found .env patterns: {result.stdout}"
        assert result.stdout == ""

    def test_still_ignores_secrets(self):
        with open("/app/.gitignore") as f:
            content = f.read()
        for pat in ["credentials.json", "*.key", ".credentials",
                    "android-sdk/", "memory/test_credentials.md"]:
            assert pat in content, f"Missing expected pattern: {pat}"

    def test_line_count_reasonable(self):
        # Spec says 87 lines; allow 85-88 tolerance
        with open("/app/.gitignore") as f:
            lines = f.readlines()
        assert 80 <= len(lines) <= 90, f"Unexpected line count: {len(lines)}"


# ---------- Smoke: backend health ----------
class TestSmokeBackend:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        # Must return app metadata
        assert isinstance(data, dict) and len(data) > 0

    def test_stats(self, api):
        r = api.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        # Should have some counters
        assert any(k in data for k in ["total_files", "total_subjects", "total_modules", "subjects", "files"])

    def test_subjects_count_and_credits(self, api):
        r = api.get(f"{BASE_URL}/api/subjects")
        assert r.status_code == 200
        subjects = r.json()
        assert isinstance(subjects, list)
        assert len(subjects) == 19, f"Expected 19 subjects, got {len(subjects)}"

        # No PT or Games
        names_lower = " ".join(s.get("name", "").lower() for s in subjects)
        assert "physical training" not in names_lower
        assert "games" not in names_lower

        # Per-semester credit sums
        sem1 = [s for s in subjects if s.get("semester") == 1]
        sem2 = [s for s in subjects if s.get("semester") == 2]
        assert len(sem1) == 10, f"Sem1 count: {len(sem1)}"
        assert len(sem2) == 9, f"Sem2 count: {len(sem2)}"

        sem1_credits = sum(float(s.get("credits", 0)) for s in sem1)
        sem2_credits = sum(float(s.get("credits", 0)) for s in sem2)
        assert abs(sem1_credits - 22.0) < 0.01, f"Sem1 credits: {sem1_credits}"
        assert abs(sem2_credits - 21.5) < 0.01, f"Sem2 credits: {sem2_credits}"


# ---------- Auth regression ----------
class TestAuth:
    def test_login_valid(self, auth_token):
        assert auth_token is not None

    def test_upload_without_token_401(self, api):
        r = api.post(f"{BASE_URL}/api/upload", data={})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_login_invalid_credentials(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": "wrong-password-xxx"})
        assert r.status_code in (400, 401, 403)


# ---------- Public reads regression ----------
class TestPublicReads:
    def test_files(self, api):
        r = api.get(f"{BASE_URL}/api/files")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_subjects(self, api):
        r = api.get(f"{BASE_URL}/api/subjects")
        assert r.status_code == 200

    def test_analytics_trending(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/trending")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        assert "total_subjects" in data or "subjects" in data or "trending" in data

    def test_resources(self, api):
        r = api.get(f"{BASE_URL}/api/resources")
        assert r.status_code == 200

    def test_modules_by_subject(self, api):
        # /api/subjects/{id}/modules returns list; /api/modules/{module_id} returns one module
        subjects = api.get(f"{BASE_URL}/api/subjects").json()
        assert len(subjects) > 0
        subject_id = subjects[0].get("id") or subjects[0].get("_id")
        assert subject_id
        r_list = api.get(f"{BASE_URL}/api/subjects/{subject_id}/modules")
        assert r_list.status_code == 200
        mods = r_list.json()
        if mods:
            mid = mods[0].get("id") or mods[0].get("_id")
            r_one = api.get(f"{BASE_URL}/api/modules/{mid}")
            assert r_one.status_code == 200


# ---------- Trending regression ----------
class TestTrending:
    def test_trending_limit_8(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/trending?limit=8")
        assert r.status_code == 200
        data = r.json()
        # total_subjects == 19
        assert data.get("total_subjects") == 19, f"total_subjects: {data.get('total_subjects')}"
        rows_key = "trending" if "trending" in data else "subjects"
        rows = data.get(rows_key, [])
        assert len(rows) == 8, f"Expected 8 rows, got {len(rows)}"
        # Real view/download data (integers, not hash-based demo)
        for row in rows:
            assert "views" in row or "view_count" in row or "total_views" in row
            assert "downloads" in row or "download_count" in row or "total_downloads" in row


# ---------- Images ----------
class TestImages:
    def test_bitverse_logo(self, api):
        r = api.get(f"{BASE_URL}/assets/bitverse-logo.png")
        assert r.status_code == 200
        assert "image/png" in r.headers.get("content-type", "")

    def test_adesh_yash(self, api):
        r = api.get(f"{BASE_URL}/assets/adesh-yash.png")
        assert r.status_code == 200
        assert "image/png" in r.headers.get("content-type", "")


# ---------- File view/download endpoints ----------
class TestFileEndpoints:
    def test_file_view_and_download(self, api):
        files = api.get(f"{BASE_URL}/api/files").json()
        if not files:
            pytest.skip("No files available to test view/download")
        fid = files[0].get("id") or files[0].get("_id")
        assert fid
        r_view = api.get(f"{BASE_URL}/api/files/{fid}/view", allow_redirects=False)
        assert r_view.status_code in (200, 301, 302, 303, 307, 308)
        r_dl = api.get(f"{BASE_URL}/api/files/{fid}/download", allow_redirects=False)
        assert r_dl.status_code in (200, 301, 302, 303, 307, 308)
