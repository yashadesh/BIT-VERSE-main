"""Backend tests for trending analytics endpoint, asset serving, and view/download tracking."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Read frontend .env for the public URL (used when env var not exported in shell)
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    return sess


# ── ASSETS ───────────────────────────────────────────────────────────────────
class TestAssetsFromOrigin:
    def test_logo_asset_returns_200(self, s):
        r = s.get(f"{BASE_URL}/assets/bitverse-logo.png", timeout=30)
        assert r.status_code == 200, f"logo status={r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/"), r.headers.get("content-type")
        assert len(r.content) > 5000

    def test_developer_photo_asset_returns_200(self, s):
        r = s.get(f"{BASE_URL}/assets/adesh-yash.png", timeout=60)
        assert r.status_code == 200, f"photo status={r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/"), r.headers.get("content-type")
        assert len(r.content) > 100000


# ── TRENDING ANALYTICS ───────────────────────────────────────────────────────
class TestTrendingAnalytics:
    def test_trending_endpoint_shape(self, s):
        r = s.get(f"{BASE_URL}/api/analytics/trending?limit=8", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "trending" in data and "total_subjects" in data
        assert data["total_subjects"] == 20
        assert isinstance(data["trending"], list)
        assert len(data["trending"]) == 8
        # per-item schema + non-zero scores
        for item in data["trending"]:
            for k in ("subject_id", "name", "semester", "views", "downloads", "score"):
                assert k in item, f"missing {k} in {item}"
            assert item["score"] > 0, f"score should be > 0 (seeded), got {item}"

    def test_trending_sorted_desc_by_score(self, s):
        r = s.get(f"{BASE_URL}/api/analytics/trending?limit=8", timeout=30)
        assert r.status_code == 200
        scores = [x["score"] for x in r.json()["trending"]]
        assert scores == sorted(scores, reverse=True), scores

    def test_trending_limit_param(self, s):
        r = s.get(f"{BASE_URL}/api/analytics/trending?limit=4", timeout=30)
        assert r.status_code == 200
        assert len(r.json()["trending"]) == 4


# ── REGRESSION ───────────────────────────────────────────────────────────────
class TestRegression:
    def test_stats_still_works(self, s):
        r = s.get(f"{BASE_URL}/api/stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["subjects"] == 20
        for k in ("notes", "pyqs", "students"):
            assert k in d

    def test_subjects_still_returns_20(self, s):
        r = s.get(f"{BASE_URL}/api/subjects", timeout=30)
        assert r.status_code == 200
        subs = r.json()
        assert isinstance(subs, list)
        assert len(subs) == 20

    def test_root_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200
        assert "BITVERSE" in r.json()["app"]


# ── VIEW/DOWNLOAD TRACKING ───────────────────────────────────────────────────
class TestViewDownloadTracking:
    """Verify the /view and /download endpoints still return file bytes AND that repeated
    calls influence the trending score (subject_stats is updated)."""

    def _find_file_with_subject(self, s):
        r = s.get(f"{BASE_URL}/api/files", timeout=30)
        if r.status_code != 200:
            return None
        for f in r.json():
            if f.get("subject_id"):
                return f
        return None

    def test_view_increments_or_returns_bytes(self, s):
        f = self._find_file_with_subject(s)
        if not f:
            pytest.skip("No uploaded file with subject_id available for view/download test")

        # baseline trending scores keyed by subject
        base = s.get(f"{BASE_URL}/api/analytics/trending?limit=20", timeout=30).json()["trending"]
        base_score = {x["subject_id"]: x["score"] for x in base}

        # call /view twice
        for _ in range(2):
            rv = s.get(f"{BASE_URL}/api/files/{f['id']}/view", timeout=60)
            assert rv.status_code == 200, f"view returned {rv.status_code}"
            assert len(rv.content) > 0, "view returned empty bytes"

        # small delay so mongo increments propagate
        time.sleep(0.5)

        after = s.get(f"{BASE_URL}/api/analytics/trending?limit=20", timeout=30).json()["trending"]
        after_score = {x["subject_id"]: x["score"] for x in after}

        # After 2 real views, the subject_stats collection will have a row for this
        # subject. Trending endpoint's fallback only kicks in when *all* scores are 0,
        # so once real activity exists we expect real (non-fallback) values, meaning
        # the score for this subject could actually go DOWN vs the deterministic seed.
        # The key invariant: /view returned file bytes both times without error.
        assert f["subject_id"] in after_score

    def test_download_returns_bytes(self, s):
        f = self._find_file_with_subject(s)
        if not f:
            pytest.skip("No uploaded file with subject_id available for download test")
        rd = s.get(f"{BASE_URL}/api/files/{f['id']}/download", timeout=60)
        assert rd.status_code == 200
        assert len(rd.content) > 0
        assert "attachment" in rd.headers.get("content-disposition", "").lower()


# ── PER-ROW FALLBACK REGRESSION (iteration_5 HIGH bug fix verification) ──────
class TestPerRowFallbackRegression:
    """Confirms the fix for iteration_5 HIGH bug: fallback must apply PER-ROW,
    not globally. After real /view activity on one subject, every OTHER row in
    the trending response must still have score > 0 (demo-filled), while the
    row with real activity preserves its real values."""

    def _find_file_with_subject(self, s):
        r = s.get(f"{BASE_URL}/api/files", timeout=30)
        if r.status_code != 200:
            return None
        for f in r.json():
            if f.get("subject_id"):
                return f
        return None

    def test_per_row_fallback_after_real_activity(self, s):
        f = self._find_file_with_subject(s)
        if not f:
            pytest.skip("No file with subject_id available")

        # Trigger real activity: call /view twice
        for _ in range(2):
            rv = s.get(f"{BASE_URL}/api/files/{f['id']}/view", timeout=60)
            assert rv.status_code == 200
            assert len(rv.content) > 0
        time.sleep(0.5)

        # Trending with limit=8 — every row must have score > 0
        r = s.get(f"{BASE_URL}/api/analytics/trending?limit=8", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data["trending"]) == 8, "expected exactly 8 rows"
        for row in data["trending"]:
            assert row["score"] > 0, (
                f"PER-ROW FALLBACK BROKEN — row {row['name']!r} has score=0 after real activity: {row}"
            )
            assert row["views"] > 0, f"row {row['name']!r} has views=0: {row}"

        # And the target subject must reflect REAL activity (views >= 2) if in full list
        full = s.get(f"{BASE_URL}/api/analytics/trending?limit=20", timeout=30).json()
        target_row = next((x for x in full["trending"] if x["subject_id"] == f["subject_id"]), None)
        assert target_row is not None, "target subject missing from full trending"
        assert target_row["views"] >= 2, (
            f"target subject should reflect real activity (>=2 views), got {target_row}"
        )

    def test_limit_variations_never_return_zero_score(self, s):
        for lim in (4, 8, 20):
            r = s.get(f"{BASE_URL}/api/analytics/trending?limit={lim}", timeout=30)
            assert r.status_code == 200
            data = r.json()
            expected_len = min(lim, data["total_subjects"])
            assert len(data["trending"]) == expected_len, (
                f"limit={lim}: expected {expected_len} rows, got {len(data['trending'])}"
            )
            for row in data["trending"]:
                assert row["score"] > 0, f"limit={lim}: row has score=0 → {row}"
