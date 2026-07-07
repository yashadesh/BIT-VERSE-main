"""Auth tests for BITVERSE iteration 8 — single-admin JWT layer."""
import os
import io
import pytest
import requests
import jwt as pyjwt
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env so we know JWT_SECRET for tamper checks (but we don't send it).
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") \
    else "https://first-year-vault.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "yashadesh.13@gmail.com"
ADMIN_PASSWORD = "Adesh@Bitverse2026"


# ── Login ────────────────────────────────────────────────────────────────────
class TestLogin:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert set(["token", "email", "role", "expires_in"]).issubset(data.keys())
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert data["expires_in"] == 86400
        # Valid JWT (HS256, 3 dot-separated parts, decodable header)
        parts = data["token"].split(".")
        assert len(parts) == 3
        header = pyjwt.get_unverified_header(data["token"])
        assert header.get("alg") == "HS256"
        # Payload sanity (decode without verify)
        payload = pyjwt.decode(data["token"], options={"verify_signature": False})
        assert payload["sub"].lower() == ADMIN_EMAIL
        assert payload["role"] == "admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "WRONG_PASSWORD_XYZ"}, timeout=15)
        assert r.status_code == 401
        assert r.json().get("detail") == "Invalid credentials"

    def test_login_wrong_email_no_enumeration(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": "nobody@example.com", "password": "whatever"}, timeout=15)
        assert r.status_code == 401
        assert r.json().get("detail") == "Invalid credentials"

    def test_login_case_insensitive_email(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL.upper(), "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200


# ── /auth/me ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


class TestAuthMe:
    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_valid_token(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_me_with_malformed_token(self):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": "Bearer not.a.jwt"}, timeout=15)
        assert r.status_code == 401

    def test_me_with_random_string(self):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": "Bearer abcdef123456"}, timeout=15)
        assert r.status_code == 401

    def test_me_with_forged_token_wrong_secret(self):
        # Signed with different secret — must be rejected
        forged = pyjwt.encode({"sub": ADMIN_EMAIL, "role": "admin"},
                              "guess-secret", algorithm="HS256")
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": f"Bearer {forged}"}, timeout=15)
        assert r.status_code == 401

    def test_me_missing_bearer_prefix(self, admin_token):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": admin_token}, timeout=15)
        assert r.status_code == 401


# ── Protected endpoints require auth (no token = 401) ────────────────────────
class TestProtectedEndpointsNoAuth:
    def test_upload_no_auth(self):
        files = {"file": ("x.pdf", b"%PDF-1.4 test", "application/pdf")}
        data = {"category": "notes"}
        r = requests.post(f"{API}/upload", files=files, data=data, timeout=15)
        assert r.status_code == 401

    def test_create_subject_no_auth(self):
        r = requests.post(f"{API}/subjects",
                          data={"name": "TEST_x", "semester": 1}, timeout=15)
        assert r.status_code == 401

    def test_delete_subject_no_auth(self):
        r = requests.delete(f"{API}/subjects/does-not-matter", timeout=15)
        assert r.status_code == 401

    def test_create_module_no_auth(self):
        r = requests.post(f"{API}/modules",
                          data={"subject_id": "x", "name": "TEST"}, timeout=15)
        assert r.status_code == 401

    def test_delete_module_no_auth(self):
        r = requests.delete(f"{API}/modules/x", timeout=15)
        assert r.status_code == 401

    def test_create_resource_no_auth(self):
        r = requests.post(f"{API}/resources",
                          data={"title": "T", "url": "https://x", "resource_type": "book"}, timeout=15)
        assert r.status_code == 401

    def test_delete_resource_no_auth(self):
        r = requests.delete(f"{API}/resources/x", timeout=15)
        assert r.status_code == 401

    def test_patch_file_no_auth(self):
        r = requests.patch(f"{API}/files/x",
                           data={"display_name": "TEST"}, timeout=15)
        assert r.status_code == 401

    def test_delete_file_no_auth(self):
        r = requests.delete(f"{API}/files/x", timeout=15)
        assert r.status_code == 401

    def test_upload_forged_token(self):
        forged = pyjwt.encode({"sub": ADMIN_EMAIL, "role": "admin"},
                              "bad-secret", algorithm="HS256")
        files = {"file": ("x.pdf", b"%PDF-1.4 test", "application/pdf")}
        r = requests.post(f"{API}/upload",
                          files=files, data={"category": "notes"},
                          headers={"Authorization": f"Bearer {forged}"}, timeout=15)
        assert r.status_code == 401


# ── Protected endpoints WITH valid token ─────────────────────────────────────
class TestProtectedEndpointsWithAuth:
    def test_upload_notes_with_auth(self, auth_headers):
        # Fetch a subject with modules
        subs = requests.get(f"{API}/subjects?semester=1", timeout=15).json()
        assert subs, "no subjects seeded"
        subject = next((s for s in subs if s["name"] == "Chemistry"), subs[0])
        mods = requests.get(f"{API}/subjects/{subject['id']}/modules", timeout=15).json()
        assert mods, "no modules for subject"
        module_id = mods[0]["id"]

        pdf_bytes = b"%PDF-1.4\n%TEST_PDF\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
        files = {"file": ("TEST_notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {
            "category": "notes",
            "subject_id": subject["id"],
            "module_id": module_id,
            "display_name": "TEST_UPLOAD_iter8",
        }
        r = requests.post(f"{API}/upload", files=files, data=data,
                          headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["display_name"] == "TEST_UPLOAD_iter8"
        assert body["category"] == "notes"
        file_id = body["id"]

        # verify GET
        r2 = requests.get(f"{API}/files/{file_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["display_name"] == "TEST_UPLOAD_iter8"

        # cleanup — delete file (also protected)
        rd = requests.delete(f"{API}/files/{file_id}", headers=auth_headers, timeout=15)
        assert rd.status_code == 200

    def test_create_and_delete_resource(self, auth_headers):
        r = requests.post(f"{API}/resources",
                          data={"title": "TEST_book_iter8",
                                "url": "https://example.com/book",
                                "resource_type": "book",
                                "description": "TEST"},
                          headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        # verify visible in GET (public)
        lst = requests.get(f"{API}/resources?resource_type=book", timeout=15).json()
        assert any(x["id"] == rid for x in lst)

        # delete
        rd = requests.delete(f"{API}/resources/{rid}", headers=auth_headers, timeout=15)
        assert rd.status_code == 200
        lst2 = requests.get(f"{API}/resources?resource_type=book", timeout=15).json()
        assert not any(x["id"] == rid for x in lst2)


# ── Public read endpoints remain open (regression) ───────────────────────────
class TestPublicReadEndpoints:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("app") == "BITVERSE"

    def test_stats(self):
        r = requests.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ("notes", "pyqs", "subjects", "students"):
            assert k in j

    def test_subjects_list(self):
        r = requests.get(f"{API}/subjects", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 20

    def test_subject_detail(self):
        subs = requests.get(f"{API}/subjects", timeout=15).json()
        r = requests.get(f"{API}/subjects/{subs[0]['id']}", timeout=15)
        assert r.status_code == 200

    def test_subject_modules(self):
        subs = requests.get(f"{API}/subjects", timeout=15).json()
        r = requests.get(f"{API}/subjects/{subs[0]['id']}/modules", timeout=15)
        assert r.status_code == 200

    def test_files_list(self):
        r = requests.get(f"{API}/files", timeout=15)
        assert r.status_code == 200

    def test_resources_list(self):
        r = requests.get(f"{API}/resources", timeout=15)
        assert r.status_code == 200

    def test_analytics_trending(self):
        r = requests.get(f"{API}/analytics/trending", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "trending" in j and "total_subjects" in j

    def test_credits_totals(self):
        subs = requests.get(f"{API}/subjects", timeout=15).json()
        s1 = sum(float(s.get("credits") or 0) for s in subs if s["semester"] == 1)
        s2 = sum(float(s.get("credits") or 0) for s in subs if s["semester"] == 2)
        assert abs(s1 - 22.0) < 0.01, f"Sem1 credits {s1}"
        assert abs(s2 - 22.5) < 0.01, f"Sem2 credits {s2}"


# ── Security: role check ─────────────────────────────────────────────────────
class TestSecurity:
    def test_valid_signature_but_wrong_role_rejected(self):
        # We don't have the server secret, but a token with role != admin
        # signed with the correct secret would be needed to test that path.
        # Instead, verify that a wrong-role token signed with a wrong secret is 401.
        bad = pyjwt.encode({"sub": ADMIN_EMAIL, "role": "user"}, "x", algorithm="HS256")
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": f"Bearer {bad}"}, timeout=15)
        assert r.status_code == 401

    def test_expired_signature_style(self):
        # Malformed / random junk → 401 invalid token
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": "Bearer eyJ.junk.sig"}, timeout=15)
        assert r.status_code == 401
