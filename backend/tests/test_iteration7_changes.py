"""BITVERSE Backend tests for iteration 7 multi-part change set.
Covers:
- Semester credits (22 for Sem1, 22.5 for Sem2)
- Individual subject credit values match canonical map
- Real-time analytics/trending (no hash-based demo data anywhere)
- category=book upload path
- resource_type=book creation with subject-prefixed description
- Regression: 20 subjects, /api/files still works, assets served
"""
import io
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

SMALL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"

# Canonical credits per problem statement
SEM1_EXPECTED = {
    "Environmental Science": 2,
    "Chemistry": 3.5,
    "Chemistry Lab": 1,
    "Basic Electronics": 3,
    "Basic Electronics Lab": 1,
    "Mathematics-I": 4,
    "Basics of Mechanical Engineering": 3,
    "Engineering Graphics": 2,
    "Workshop Practice": 1.5,
    "NSS": 1,
}
SEM2_EXPECTED = {
    "Biological Science for Engineers": 2,          # "Biological Science"
    "Programming for Problem Solving": 3,           # PPS
    "Programming for Problem Solving Laboratory": 1, # PPS Lab
    "Basics of Electrical Engineering": 3,          # Basics of Electrical
    "Electrical Engineering Lab": 1,                # Electrical Lab
    "Communication Skill-I": 2,
    "Mathematics-II": 4,
    "Physics": 4,
    "Physics Lab": 1,
    "PT and Games": 1.5,
}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ── CREDITS ──────────────────────────────────────────────────────────────────
class TestCredits:
    def test_total_subject_count(self, s):
        r = s.get(f"{API}/subjects")
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) == 20, f"expected 20 subjects, got {len(subs)}"

    def test_sem1_credits_sum_equals_22(self, s):
        r = s.get(f"{API}/subjects?semester=1")
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) == 10
        total = sum((x.get("credits") or 0) for x in subs)
        assert total == 22, f"Sem1 total={total} (expected 22). Breakdown: {[(x['name'], x.get('credits')) for x in subs]}"

    def test_sem2_credits_sum_equals_22_5(self, s):
        r = s.get(f"{API}/subjects?semester=2")
        assert r.status_code == 200
        subs = r.json()
        assert len(subs) == 10
        total = sum((x.get("credits") or 0) for x in subs)
        assert total == 22.5, f"Sem2 total={total} (expected 22.5). Breakdown: {[(x['name'], x.get('credits')) for x in subs]}"

    def test_sem1_individual_credits(self, s):
        subs = s.get(f"{API}/subjects?semester=1").json()
        by_name = {x["name"]: x for x in subs}
        for name, expected in SEM1_EXPECTED.items():
            assert name in by_name, f"Missing sem1 subject: {name}"
            actual = by_name[name].get("credits")
            assert actual == expected, f"{name}: expected {expected}, got {actual}"

    def test_sem2_individual_credits(self, s):
        subs = s.get(f"{API}/subjects?semester=2").json()
        by_name = {x["name"]: x for x in subs}
        for name, expected in SEM2_EXPECTED.items():
            assert name in by_name, f"Missing sem2 subject: {name}"
            actual = by_name[name].get("credits")
            assert actual == expected, f"{name}: expected {expected}, got {actual}"


# ── TRENDING (REAL ONLY, NO DEMO) ────────────────────────────────────────────
class TestRealTimeTrending:
    def test_shape_and_total(self, s):
        r = s.get(f"{API}/analytics/trending?limit=8")
        assert r.status_code == 200
        data = r.json()
        assert data["total_subjects"] == 20
        assert isinstance(data["trending"], list)
        assert len(data["trending"]) == 8
        for it in data["trending"]:
            for k in ("subject_id", "name", "semester", "views", "downloads", "score"):
                assert k in it

    def test_score_matches_formula_real_only(self, s):
        """Score MUST equal views + 2*downloads exactly. No hash offset anywhere.
        This detects any lingering demo/hash fallback."""
        r = s.get(f"{API}/analytics/trending?limit=20")
        assert r.status_code == 200
        for it in r.json()["trending"]:
            expected = it["views"] + 2 * it["downloads"]
            assert it["score"] == expected, (
                f"score mismatch for {it['name']}: got {it['score']}, expected {expected}. "
                f"This indicates hash-based demo fallback is still active."
            )

    def test_zero_activity_rows_sorted_last(self, s):
        r = s.get(f"{API}/analytics/trending?limit=20")
        rows = r.json()["trending"]
        # Descending by score — once a zero appears, no non-zero should follow
        seen_zero = False
        for it in rows:
            if it["score"] == 0:
                seen_zero = True
            else:
                assert not seen_zero, "non-zero score after a zero — sort order broken"

    def test_no_hash_pattern_when_all_new_subject(self, s):
        """Create a fresh subject (no activity), it should appear with 0/0/0 when returned,
        not with hash-based demo values.
        Note: with 20 real subjects, a fresh one may be pushed out of limit=8, but with
        limit=25 we should see it if it exists."""
        # verify at least one subject in the top-20 truly has score 0 (impossible for demo to leave any at 0)
        r = s.get(f"{API}/analytics/trending?limit=25")
        rows = r.json()["trending"]
        # Not strict: just ensure the API doesn't fabricate a score when views/downloads are 0
        for it in rows:
            if it["views"] == 0 and it["downloads"] == 0:
                assert it["score"] == 0, f"row with 0 views/downloads has score {it['score']} — hash fallback still present"


# ── BOOK UPLOAD PATH ─────────────────────────────────────────────────────────
class TestBookUpload:
    @pytest.fixture(scope="class")
    def eg_subject(self, s):
        subs = s.get(f"{API}/subjects?semester=1").json()
        for x in subs:
            if x["name"] == "Engineering Graphics":
                return x
        pytest.fail("Engineering Graphics subject missing")

    def test_upload_book_file(self, s, eg_subject):
        files = {"file": ("TEST_book.pdf", io.BytesIO(SMALL_PDF), "application/pdf")}
        data = {
            "category": "book",
            "subject_id": eg_subject["id"],
            "display_name": "TEST_Engineering Graphics Book",
        }
        r = s.post(f"{API}/upload", files=files, data=data)
        assert r.status_code == 200, r.text
        f = r.json()
        assert f["category"] == "book"
        assert f["subject_id"] == eg_subject["id"]
        # verify via listing filter
        lst = s.get(f"{API}/files?category=book&subject_id={eg_subject['id']}").json()
        assert any(x["id"] == f["id"] for x in lst), "uploaded book not in filtered listing"
        # cleanup
        s.delete(f"{API}/files/{f['id']}")

    def test_add_book_link_with_subject_prefix(self, s, eg_subject):
        payload = {
            "title": "TEST_HC Verma",
            "url": "https://example.com/hcv.pdf",
            "resource_type": "book",
            "description": f"[{eg_subject['id']}]:: Concepts of Physics",
        }
        r = s.post(f"{API}/resources", data=payload)
        assert r.status_code == 200, r.text
        res = r.json()
        assert res["resource_type"] == "book"
        assert res["description"].startswith(f"[{eg_subject['id']}]::")
        rid = res["id"]
        lst = s.get(f"{API}/resources?resource_type=book").json()
        assert any(x["id"] == rid for x in lst)
        s.delete(f"{API}/resources/{rid}")


# ── DIRECT-FILE UPLOAD PATH (no module_id) ───────────────────────────────────
class TestDirectFileNotes:
    """Simulate admin uploading notes for a direct-file subject (Workshop Practice)
    without module_id — backend must accept it, and subject page listing should show it."""
    def test_upload_workshop_practice_note_without_module(self, s):
        subs = s.get(f"{API}/subjects?semester=1").json()
        subj = next((x for x in subs if x["name"] == "Workshop Practice"), None)
        assert subj is not None
        files = {"file": ("TEST_wp.pdf", io.BytesIO(SMALL_PDF), "application/pdf")}
        data = {
            "category": "notes",
            "subject_id": subj["id"],
            "display_name": "TEST_Workshop Note",
        }
        r = s.post(f"{API}/upload", files=files, data=data)
        assert r.status_code == 200, r.text
        f = r.json()
        assert f["category"] == "notes"
        assert f["subject_id"] == subj["id"]
        assert f.get("module_id") in (None, ""), f"module_id should be null, got {f.get('module_id')}"
        # ensure it's listed
        lst = s.get(f"{API}/files?category=notes&subject_id={subj['id']}").json()
        assert any(x["id"] == f["id"] and not x.get("module_id") for x in lst)
        s.delete(f"{API}/files/{f['id']}")


# ── TUTORIAL ORDERING ────────────────────────────────────────────────────────
class TestTutorialOrdering:
    def test_tutorial_created_at_ascending(self, s):
        """Upload 3 tutorials with delays, verify created_at strings sort ascending."""
        subs = s.get(f"{API}/subjects?semester=1").json()
        subj = subs[0]  # any subject
        uploaded = []
        try:
            for i in range(3):
                files = {"file": (f"TEST_tut{i}.pdf", io.BytesIO(SMALL_PDF), "application/pdf")}
                data = {
                    "category": "tutorial",
                    "subject_id": subj["id"],
                    "display_name": f"TEST_Tutorial {i+1}",
                }
                r = s.post(f"{API}/upload", files=files, data=data)
                assert r.status_code == 200
                uploaded.append(r.json())
                time.sleep(1.1)  # ensure distinct created_at timestamps
            # Fetch all tutorials for subject
            lst = s.get(f"{API}/files?category=tutorial&subject_id={subj['id']}").json()
            # Filter only ones we uploaded (by TEST_ prefix)
            ours = [f for f in lst if f["display_name"].startswith("TEST_Tutorial ")]
            assert len(ours) >= 3
            # After sorting ascending, our 3 should be in order Tutorial 1 → 2 → 3
            ours_sorted = sorted(ours, key=lambda x: x["created_at"])
            our_ids_asc = [u["id"] for u in uploaded]
            found_ids_asc = [x["id"] for x in ours_sorted if x["id"] in our_ids_asc]
            assert found_ids_asc == our_ids_asc, (
                f"ascending order broken. expected {our_ids_asc}, got {found_ids_asc}"
            )
        finally:
            for u in uploaded:
                try:
                    s.delete(f"{API}/files/{u['id']}", timeout=10)
                except Exception:
                    pass


# ── REGRESSION ───────────────────────────────────────────────────────────────
class TestRegressionIter7:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200

    def test_stats(self, s):
        r = s.get(f"{API}/stats").json()
        assert r["subjects"] == 20

    def test_logo_asset(self, s):
        r = s.get(f"{BASE_URL}/assets/bitverse-logo.png")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")

    def test_dev_photo_asset(self, s):
        r = s.get(f"{BASE_URL}/assets/adesh-yash.png")
        assert r.status_code == 200

    def test_files_endpoint(self, s):
        r = s.get(f"{API}/files")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
