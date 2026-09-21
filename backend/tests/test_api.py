import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/constitution")

from app.main import app  # noqa: E402
from app.db.models import Hearts  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402

client = TestClient(app)

TEST_EMAIL = f"pytest-{uuid.uuid4().hex[:8]}@test.com"
PASSWORD = "password123"

ORIG_ART1_TITLE = ""


def set_hearts_full(user_id: str) -> None:
    """Top the user's hearts up so heart-gated tests are deterministic."""
    with SessionLocal() as db:
        h = db.get(Hearts, user_id)
        if h is None:
            db.add(Hearts(user_id=user_id, hearts_left=10, max_hearts=10))
        else:
            h.hearts_left = 10
            h.last_refill_ts = None
        db.commit()


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
    set_hearts_full(uid)
    # Completions are gated on the article quiz; answer each question correctly
    # (one wrong probe per question to learn its correct_option, then the correct try).
    quiz = client.get("/api/articles/ART-1/quiz").json()
    assert len(quiz) >= 1
    for q in quiz:
        probe = client.post(
            f"/api/users/{uid}/quiz/{q['id']}/attempt",
            json={"question_id": q["id"], "selected_option": "A"},
        )
        assert probe.status_code == 200, probe.text
        body = probe.json()
        if not body["is_correct"]:
            r = client.post(
                f"/api/users/{uid}/quiz/{q['id']}/attempt",
                json={"question_id": q["id"], "selected_option": body["correct_option"]},
            )
            assert r.status_code == 200, r.text
            assert r.json()["is_correct"] is True

    r = client.post(f"/api/users/{uid}/articles/ART-1/complete")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "success"
    assert "ART-2" in body["unlocked_targets"]

    prog = client.get(f"/api/users/{uid}/progress").json()
    assert prog["total_xp"] == len(quiz) * 5 + 15  # quiz XP + article completion XP
    statuses = {a["article_id"]: a["status"] for a in prog["articles"]}
    assert statuses["ART-1"] == "completed"
    assert statuses["ART-2"] == "unlocked"
    assert statuses["ART-3"] == "locked"


def test_complete_requires_quiz_pass(auth_user):
    uid = auth_user["user_id"]
    # No quiz attempts for ART-2 yet -> completion must be refused.
    r = client.post(f"/api/users/{uid}/articles/ART-2/complete")
    assert r.status_code == 403
    prog = client.get(f"/api/users/{uid}/progress").json()
    statuses = {a["article_id"]: a["status"] for a in prog["articles"]}
    assert statuses["ART-2"] == "unlocked"


def test_quiz_attempt_correct_awards_xp(auth_user):
    uid = auth_user["user_id"]
    set_hearts_full(uid)
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
    # Isolate this test from prior hearts spent by the completion tests.
    with SessionLocal() as db:
        h = db.get(Hearts, uid)
        if h is None:
            db.add(Hearts(user_id=uid, hearts_left=10, max_hearts=10))
        else:
            h.hearts_left = 10
            h.last_refill_ts = None
        db.commit()
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


def test_progress_reports_max_hearts_and_refill(auth_user):
    uid = auth_user["user_id"]
    with SessionLocal() as db:
        h = db.get(Hearts, uid)
        h.hearts_left = 10
        h.last_refill_ts = None
        db.commit()
    data = client.get(f"/api/users/{uid}/progress").json()
    assert data["max_hearts"] == 10
    assert data["hearts_left"] == 10
    assert data["hearts_refill_at"] is None  # full -> no timer


def test_heart_blocks_attempt_at_zero(auth_user):
    uid = auth_user["user_id"]
    q = client.get("/api/articles/ART-1/quiz").json()[0]
    with SessionLocal() as db:
        h = db.get(Hearts, uid)
        h.hearts_left = 0
        h.last_refill_ts = None
        db.commit()
    # Both wrong and correct attempts are blocked at 0 hearts.
    r = client.post(
        f"/api/users/{uid}/quiz/{q['id']}/attempt",
        json={"question_id": q["id"], "selected_option": "A"},
    )
    assert r.status_code == 403
    assert "out of hearts" in r.json()["detail"].lower()
    # Did not record an attempt for this question.
    with SessionLocal() as db:
        from app.db.models import QuizAttempt

        before = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == uid, QuizAttempt.question_id == q["id"])
            .count()
        )
    r = client.post(
        f"/api/users/{uid}/quiz/{q['id']}/attempt",
        json={"question_id": q["id"], "selected_option": "A"},
    )
    assert r.status_code == 403
    with SessionLocal() as db:
        from app.db.models import QuizAttempt

        n = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == uid, QuizAttempt.question_id == q["id"])
            .count()
        )
    assert n == before


def test_hearts_use_endpoint_charges_and_blocks(auth_user):
    uid = auth_user["user_id"]
    with SessionLocal() as db:
        h = db.get(Hearts, uid)
        h.hearts_left = 1
        h.last_refill_ts = None
        db.commit()
    r = client.post(f"/api/users/{uid}/hearts/use")
    assert r.status_code == 200
    body = r.json()
    assert body["hearts_left"] == 0
    assert body["max_hearts"] == 10
    assert body["refill_at"] is not None  # timer starts once below cap
    assert client.post(f"/api/users/{uid}/hearts/use").status_code == 403


def test_hearts_refill_after_interval(auth_user):
    uid = auth_user["user_id"]
    with SessionLocal() as db:
        from datetime import datetime, timedelta, timezone

        h = db.get(Hearts, uid)
        h.hearts_left = 5
        h.last_refill_ts = datetime.now(timezone.utc) - timedelta(minutes=85)
        db.commit()
    data = client.get(f"/api/users/{uid}/progress").json()
    # 85 minutes elapsed at 30 min/heart -> exactly 2 refilled (7 left).
    assert data["hearts_left"] == 7
    # Timer continues (not full); carries 25 min, so next refill is ~5 min away.
    from datetime import datetime as dt

    refill_at = dt.fromisoformat(data["hearts_refill_at"])
    remaining = (refill_at - dt.now(timezone.utc)).total_seconds()
    assert 200 < remaining < 800


def test_hearts_full_resets_timer(auth_user):
    uid = auth_user["user_id"]
    with SessionLocal() as db:
        from datetime import datetime, timezone

        h = db.get(Hearts, uid)
        h.hearts_left = 8
        h.last_refill_ts = datetime.now(timezone.utc)
        db.commit()
    data = client.get(f"/api/users/{uid}/progress").json()
    assert data["hearts_refill_at"] is not None
    # Consume the timer by pushing to cap through the refill path.
    with SessionLocal() as db:
        from datetime import datetime, timedelta, timezone

        h = db.get(Hearts, uid)
        h.hearts_left = 9
        h.last_refill_ts = datetime.now(timezone.utc) - timedelta(minutes=31)
        db.commit()
    data = client.get(f"/api/users/{uid}/progress").json()
    assert data["hearts_left"] == 10
    assert data["hearts_refill_at"] is None


# --- Practice mode + weekly quest ---


def test_practice_awards_reduced_xp_without_hearts(auth_user):
    uid = auth_user["user_id"]
    # ART-1 is completed by the earlier completion test; practice must not spend hearts.
    with SessionLocal() as db:
        h = db.get(Hearts, uid)
        h.hearts_left = 1
        db.commit()
    q = client.get("/api/articles/ART-1/quiz").json()[0]
    before_xp = client.get(f"/api/users/{uid}/progress").json()["total_xp"]
    correct = None
    for letter in ("A", "B", "C", "D"):
        r = client.post(
            f"/api/users/{uid}/quiz/{q['id']}/attempt?practice=1",
            json={"question_id": q["id"], "selected_option": letter},
        )
        assert r.status_code == 200, r.text
        if r.json()["is_correct"]:
            correct = r.json()
            break
    assert correct is not None
    assert correct["xp_earned"] == 4
    after = client.get(f"/api/users/{uid}/progress").json()
    assert after["total_xp"] == before_xp + 4
    # Misses during practice cost no hearts.
    assert after["hearts_left"] == 1


def test_practice_blocked_on_uncompleted(auth_user):
    uid = auth_user["user_id"]
    # ART-2 is unlocked (not completed) in this suite -> practice refused.
    qs = client.get("/api/articles/ART-2/quiz").json()
    if not qs:
        pytest.skip("ART-2 has no active questions")
    r = client.post(
        f"/api/users/{uid}/quiz/{qs[0]['id']}/attempt?practice=1",
        json={"question_id": qs[0]["id"], "selected_option": "A"},
    )
    assert r.status_code == 403
    assert "completed" in r.json()["detail"].lower()


def test_progress_reports_weekly_quest(auth_user):
    uid = auth_user["user_id"]
    before = client.get(f"/api/users/{uid}/progress").json()
    assert before["weekly_xp_goal"] == 100
    assert before["weekly_xp"] >= 0
    assert before["weekly_xp"] <= before["total_xp"]
    # Earn weekly XP through practice (no hearts involved).
    q = client.get("/api/articles/ART-1/quiz").json()[0]
    for letter in ("A", "B", "C", "D"):
        r = client.post(
            f"/api/users/{uid}/quiz/{q['id']}/attempt?practice=1",
            json={"question_id": q["id"], "selected_option": letter},
        )
        if r.status_code == 200 and r.json()["is_correct"]:
            break
    after = client.get(f"/api/users/{uid}/progress").json()
    assert after["weekly_xp"] > before["weekly_xp"]


# --- Search ---


def test_search_fts():
    r = client.get("/api/search", params={"q": "fundamental law"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_leaderboard():
    r = client.get("/api/leaderboard")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_leaderboard_weekly_window(auth_user):
    uid = auth_user["user_id"]
    before_xp = client.get(f"/api/users/{uid}/progress").json()["weekly_xp"]
    # Weekly XP is authoritative from the leagues snapshot.
    rows = client.get("/api/leaderboard", params={"window": "week", "limit": 100}).json()
    assert rows
    assert all("xp_earned" in row for row in rows)
    assert [row["xp_earned"] for row in rows] == sorted((row["xp_earned"] for row in rows), reverse=True)
    me = next((row for row in rows if row["user_id"] == uid), None)
    if me:
        assert me["xp_earned"] == before_xp
    # All-time window keeps total_xp semantics.
    rows_all = client.get("/api/leaderboard", params={"window": "all"}).json()
    assert all(row["xp_earned"] == row["total_xp"] for row in rows_all)


# --- Admin ---


@pytest.fixture(scope="module")
def admin_user(auth_user):
    # Promote the shared test user to admin for the session.
    with SessionLocal() as db:
        from app.db.models import User

        u = db.get(User, auth_user["user_id"])
        u.role = "admin"
        db.commit()
    return auth_user


@pytest.fixture(scope="module")
def plain_user():
    email = f"pytest-plain-{uuid.uuid4().hex[:8]}@test.com"
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "display_name": "Plain"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    import jwt as pyjwt

    user_id = pyjwt.decode(token, options={"verify_signature": False})["sub"]
    return {"token": token, "user_id": user_id}


def test_admin_me_reports_role(admin_user):
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_plain_user_role_default(plain_user):
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {plain_user['token']}"})
    assert r.status_code == 200
    assert r.json()["role"] == "user"


def test_admin_requires_admin(admin_user, plain_user):
    # No token -> 401.
    assert client.get("/api/admin/articles").status_code == 401
    # Plain user -> 403.
    r = client.get(
        "/api/admin/articles", headers={"Authorization": f"Bearer {plain_user['token']}"}
    )
    assert r.status_code == 403
    # Admin -> 200.
    r = client.get(
        "/api/admin/articles", headers={"Authorization": f"Bearer {admin_user['token']}"}
    )
    assert r.status_code == 200


def test_amend_records_revision_and_soft_deletes_quiz(admin_user):
    with SessionLocal() as db:
        from app.db.models import Article

        art = db.get(Article, "ART-1")
        orig_quiz = len(art.quiz_questions)

    # Replace ART-1 with a new title, keep first quiz question, drop the rest.
    r = client.get(
        "/api/admin/articles/ART-1", headers={"Authorization": f"Bearer {admin_user['token']}"}
    )
    assert r.status_code == 200
    full = r.json()
    assert full["id"] == "ART-1"
    global ORIG_ART1_TITLE
    ORIG_ART1_TITLE = full["title"]

    keep = full["quiz"][0]
    payload = {
        "article": {
            "article_number": full["article_number"],
            "title": full["title"] + " (amended)",
            "part_number": full["part_number"],
            "part_title": full["part_title"],
        },
        "clauses": full["clauses"],
        "dependencies": full["dependencies"],
        "quiz": [
            {"id": keep["id"], "question_text": keep["question_text"], "option_a": keep["option_a"],
             "option_b": keep["option_b"], "option_c": keep["option_c"], "option_d": keep["option_d"],
             "correct_option": keep["correct_option"], "explanation": keep["explanation"],
             "difficulty": keep["difficulty"], "knowledge_type": keep["knowledge_type"]}
        ],
        "revision": {"amendment_date": "2026-01-01", "amendment_act": "Constitution (First Amendment)", "summary": "pytest amend"},
    }
    r = client.post(
        "/api/admin/articles/ART-1/amend",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "success"
    revision_id = r.json()["revision_id"]

    # Snapshot captured in revision row.
    with SessionLocal() as db:
        from app.db.models import ArticleRevision

        rev = db.get(ArticleRevision, revision_id)
        assert rev.snapshot["title"] == full["title"]
        assert len(rev.snapshot["quiz"]) == orig_quiz
        db.refresh(art := db.get(Article, "ART-1"))
        assert art.title == full["title"] + " (amended)"
        assert len([q for q in art.quiz_questions if q.active]) == 1

    # Active quiz still served; deactivated questions hidden.
    active_ids = {q["id"] for q in client.get("/api/articles/ART-1/quiz").json()}
    assert len(active_ids) == 1
    assert keep["id"] in active_ids

    # Public article title reflects the change.
    assert client.get("/api/articles/ART-1").json()["title"] == full["title"] + " (amended)"


def test_amend_restores_original(admin_user):
    # Undo the amend from the previous test so later tests are untouched.
    r = client.get(
        "/api/admin/articles/ART-1", headers={"Authorization": f"Bearer {admin_user['token']}"}
    )
    full = r.json()
    payload = {
        "article": {
            "article_number": full["article_number"],
            "title": ORIG_ART1_TITLE,
            "part_number": full["part_number"],
            "part_title": full["part_title"],
        },
        "clauses": full["clauses"],
        "dependencies": full["dependencies"],
        "quiz": [
            {"id": q["id"], "question_text": q["question_text"],
             "option_a": q["option_a"], "option_b": q["option_b"], "option_c": q["option_c"],
             "option_d": q["option_d"], "correct_option": q["correct_option"],
             "explanation": q["explanation"], "difficulty": q["difficulty"],
             "knowledge_type": q["knowledge_type"], "active": True}
            for q in full["quiz"]
        ],
        "revision": {"summary": "pytest restore"},
    }
    r = client.post(
        "/api/admin/articles/ART-1/amend",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert r.status_code == 200, r.text
    # Back to the seeded title, all questions active again.
    assert client.get("/api/articles/ART-1").json()["title"] == ORIG_ART1_TITLE


def test_revisions_listed(admin_user):
    r = client.get(
        "/api/admin/revisions",
        params={"article_id": "ART-1"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert r.status_code == 200
    revs = r.json()
    assert len(revs) >= 2
    assert revs[0]["summary"]
    assert revs[0]["amendment_act"] == "Constitution (First Amendment)" or revs[0]["amendment_act"] is None
