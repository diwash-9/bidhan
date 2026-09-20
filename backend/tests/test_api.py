import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/constitution")

from app.main import app  # noqa: E402

client = TestClient(app)

TEST_EMAIL = f"pytest-{uuid.uuid4().hex[:8]}@test.com"
PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_user():
    r = client.post(
        "/api/auth/register",
        json={"email": TEST_EMAIL, "password": PASSWORD, "display_name": "Pytest User"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    import jwt as pyjwt

    user_id = pyjwt.decode(token, options={"verify_signature": False})["sub"]
    return {"token": token, "user_id": user_id}


# --- Health ---


def test_health():
    assert client.get("/api/health").json() == {"status": "healthy"}


# --- Auth ---


def test_register_duplicate_conflict(auth_user):
    r = client.post(
        "/api/auth/register",
        json={"email": TEST_EMAIL, "password": PASSWORD, "display_name": "Dup"},
    )
    assert r.status_code == 409


def test_login_success(auth_user):
    r = client.post("/api/auth/login", json={"email": TEST_EMAIL, "password": PASSWORD})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(auth_user):
    r = client.post("/api/auth/login", json={"email": TEST_EMAIL, "password": "nope-nope"})
    assert r.status_code == 401


def test_refresh_roundtrip(auth_user):
    login = client.post("/api/auth/login", json={"email": TEST_EMAIL, "password": PASSWORD}).json()
    r = client.post("/api/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert client.post("/api/auth/refresh", json={"refresh_token": "garbage"}).status_code == 401


# --- Content ---


def test_parts_count():
    r = client.get("/api/parts")
    assert r.status_code == 200
    assert len(r.json()) == 35


def test_article_detail_shape():
    r = client.get("/api/articles/ART-1")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "ART-1"
    assert len(data["clauses"]) >= 1
    assert isinstance(data["dependencies"], list)


def test_article_404():
    assert client.get("/api/articles/ART-999").status_code == 404


def test_quiz_for_article():
    r = client.get("/api/articles/ART-1/quiz")
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) >= 1
    assert set(qs[0]) >= {"id", "question_text", "option_a", "option_b", "option_c", "option_d"}


# --- Progress + gamification ---


def test_progress_materializes_rows(auth_user):
    r = client.get(f"/api/users/{auth_user['user_id']}/progress")
    assert r.status_code == 200
    data = r.json()
    assert len(data["articles"]) == 308
    # Only ART-1 unlocked initially.
    unlocked = [a for a in data["articles"] if a["status"] == "unlocked"]
    assert [a["article_id"] for a in unlocked] == ["ART-1"]


def test_complete_article_bfs_unlock(auth_user):
    uid = auth_user["user_id"]
    r = client.post(f"/api/users/{uid}/articles/ART-1/complete")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "success"
    assert "ART-2" in body["unlocked_targets"]

    prog = client.get(f"/api/users/{uid}/progress").json()
    assert prog["total_xp"] == 15
    statuses = {a["article_id"]: a["status"] for a in prog["articles"]}
    assert statuses["ART-1"] == "completed"
    assert statuses["ART-2"] == "unlocked"
    assert statuses["ART-3"] == "locked"


def test_quiz_attempt_correct_awards_xp(auth_user):
    uid = auth_user["user_id"]
    q = client.get("/api/articles/ART-1/quiz").json()[0]
    before = client.get(f"/api/users/{uid}/progress").json()["total_xp"]
    r = client.post(
        f"/api/users/{uid}/quiz/{q['id']}/attempt",
        json={"question_id": q["id"], "selected_option": "A"},
    )
    body = r.json()
    if not body["is_correct"]:
        correct = body["correct_option"]
        r = client.post(
            f"/api/users/{uid}/quiz/{q['id']}/attempt",
            json={"question_id": q["id"], "selected_option": correct},
        )
        body = r.json()
    assert body["is_correct"] is True
    assert r.json()["explanation"]
    after = client.get(f"/api/users/{uid}/progress").json()["total_xp"]
    assert after == before + 5


def test_quiz_attempt_wrong_consumes_heart(auth_user):
    uid = auth_user["user_id"]
    q = client.get("/api/articles/ART-1/quiz").json()[0]
    before = client.get(f"/api/users/{uid}/progress").json()["hearts_left"]
    r = client.post(
        f"/api/users/{uid}/quiz/{q['id']}/attempt",
        json={"question_id": q["id"], "selected_option": "A"},
    )
    body = r.json()
    if body["is_correct"]:
        # 'A' happened to be right; retry with 'B' (server says correct is A).
        body["correct_option"] = "A"
        r = client.post(
            f"/api/users/{uid}/quiz/{q['id']}/attempt",
            json={"question_id": q["id"], "selected_option": "B"},
        )
        body = r.json()
        assert body["is_correct"] is False
    after = client.get(f"/api/users/{uid}/progress").json()["hearts_left"]
    assert after == before - 1


# --- Search ---


def test_search_fts():
    r = client.get("/api/search", params={"q": "fundamental law"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_leaderboard():
    r = client.get("/api/leaderboard")
    assert r.status_code == 200
    assert isinstance(r.json(), list)