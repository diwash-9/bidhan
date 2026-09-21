import os
import sys
import uuid

from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/constitution")

from app.db.models import QuizAttempt, QuizQuestion  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.db.sync_quiz import DEFAULT_FILE, load_entries, sync  # noqa: E402

TEST_TEXT_PREFIX = "[sync-test]"


def _fresh_entry() -> dict:
    return {
        "article_id": "ART-1",
        "question_text": f"{TEST_TEXT_PREFIX} {uuid.uuid4().hex}",
        "option_a": "Option A placeholder",
        "option_b": "Option B placeholder",
        "option_c": "Option C placeholder",
        "option_d": "Option D placeholder",
        "correct_option": "C",
        "explanation": "Test-only scenario question.",
        "difficulty": 2,
        "knowledge_type": "scenario",
    }


def _purge(db, article_id: str = "ART-1") -> None:
    rows = db.scalars(
        select(QuizQuestion).where(QuizQuestion.question_text.like(f"{TEST_TEXT_PREFIX}%"))
    ).all()
    for r in rows:
        db.query(QuizAttempt).filter(QuizAttempt.question_id == r.id).delete()
    for r in rows:
        db.delete(r)
    db.commit()


def test_pilot_scenario_file_is_structure_valid() -> None:
    entries = load_entries(DEFAULT_FILE)
    assert len(entries) > 0
    for entry in entries:
        assert entry["question_text"].strip()
        for letter in ("A", "B", "C", "D"):
            assert entry[f"option_{letter.lower()}"].strip()
        assert entry["correct_option"] in {"A", "B", "C", "D"}
        assert isinstance(entry["difficulty"], int) and 1 <= entry["difficulty"] <= 5
        assert entry.get("knowledge_type") in {"scenario", "article_subject", "clause_text", "quote_match"}
        assert entry["explanation"]


def test_articles_referenced_by_pilot_exist() -> None:
    with SessionLocal() as db:
        from app.db.models import Article

        for entry in load_entries(DEFAULT_FILE):
            assert db.get(Article, entry["article_id"]) is not None


def test_sync_is_idempotent_and_preserves_ids() -> None:
    entry = _fresh_entry()
    with SessionLocal() as db:
        _purge(db)
        sync(db, [entry])
        first = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        assert first is not None
        assert first.knowledge_type == "scenario"
        first_id = first.id
        count_after_first = len(
            db.scalars(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"])).all()
        )
        sync(db, [entry])
        second = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        assert second is not None
        assert second.id == first_id
        count_after_second = len(
            db.scalars(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"])).all()
        )
        assert count_after_first == 1
        assert count_after_second == 1
        assert second.correct_option == entry["correct_option"]
        _purge(db)


def test_sync_update_path_writes_fields() -> None:
    entry = _fresh_entry()
    with SessionLocal() as db:
        _purge(db)
        sync(db, [entry])
        row = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        assert row.difficulty == 2
        edited = dict(entry, correct_option="A", difficulty=1, explanation="Updated explanation.")
        sync(db, [edited])
        row = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        assert row.correct_option == "A"
        assert row.difficulty == 1
        assert row.explanation == "Updated explanation."
        _purge(db)


def test_sync_keeps_attempts_referencing_the_question() -> None:
    entry = _fresh_entry()
    with SessionLocal() as db:
        _purge(db)
        sync(db, [entry])
        row = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        from app.core.security import hash_password
        from app.db.models import User

        user = User(
            id=str(uuid.uuid4()),
            email=f"{uuid.uuid4().hex}@test.com",
            display_name="Sync Tester",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.flush()
        attempt = QuizAttempt(user_id=user.id, question_id=row.id, selected_option="A", is_correct=True)
        db.add(attempt)
        db.commit()
        attempt_id = attempt.id
        question_id_before = row.id

        sync(db, [entry])
        row_after = db.scalar(select(QuizQuestion).where(QuizQuestion.question_text == entry["question_text"]))
        assert row_after.id == question_id_before
        attempt_after = db.get(QuizAttempt, attempt_id)
        assert attempt_after is not None
        assert attempt_after.question_id == question_id_before
        _purge(db)
        db.delete(db.get(User, user.id))
        db.commit()