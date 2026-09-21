"""Upsert Authored (scenario) quiz questions from a versioned JSON file into PostgreSQL.

Idempotent: matches existing rows by (article_id, question_text) and updates them;
unmatched entries are inserted. Nothing is ever deleted, so quiz_attempt foreign
keys remain valid across refreshes.

Usage:
    python -m app.db.sync_quiz                 # uses db/scenario_questions.json
    SCENARIO_FILE=/path/to/file.json python -m app.db.sync_quiz
"""

import json
import os
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.models import Article, QuizQuestion
from app.db.session import SessionLocal

DEFAULT_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../db/scenario_questions.json")
)

VALID_LETTERS = {"A", "B", "C", "D"}


def load_entries(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        sys.exit(f"error: {path} must contain a JSON list of questions")
    return data


def validate(db: Session, entry: dict, index: int) -> None:
    err = f"error: scenario question #{index + 1} in question '{entry.get('question_text', '')}'"
    for field in ("article_id", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"):
        if not entry.get(field):
            sys.exit(f"{err} is missing required field '{field}'")
    letter = entry["correct_option"].upper()
    if letter not in VALID_LETTERS:
        sys.exit(f"{err} has invalid correct_option '{entry['correct_option']}'")
    difficulty = entry.get("difficulty", 1)
    if not isinstance(difficulty, int) or not 1 <= difficulty <= 5:
        sys.exit(f"{err} has invalid difficulty {difficulty!r}")
    if not db.get(Article, entry["article_id"]):
        sys.exit(f"{err} references unknown article '{entry['article_id']}'")


def sync(db: Session, entries: list[dict]) -> tuple[int, int]:
    """Returns (inserted, updated)."""
    inserted = updated = 0
    for i, entry in enumerate(entries):
        validate(db, entry, i)
        letter = entry["correct_option"].upper()
        fields = {
            "option_a": entry["option_a"],
            "option_b": entry["option_b"],
            "option_c": entry["option_c"],
            "option_d": entry["option_d"],
            "correct_option": letter,
            "explanation": entry.get("explanation"),
            "difficulty": entry.get("difficulty", 1),
            "knowledge_type": entry.get("knowledge_type", "scenario"),
            "active": True,
        }
        row = db.scalar(
            select(QuizQuestion).where(
                QuizQuestion.article_id == entry["article_id"],
                QuizQuestion.question_text == entry["question_text"],
            )
        )
        if row:
            for key, value in fields.items():
                setattr(row, key, value)
            updated += 1
        else:
            db.add(
                QuizQuestion(
                    article_id=entry["article_id"],
                    question_text=entry["question_text"],
                    **fields,
                )
            )
            inserted += 1
    db.commit()
    return inserted, updated


def main() -> None:
    path = os.environ.get("SCENARIO_FILE", DEFAULT_FILE)
    entries = load_entries(path)
    with SessionLocal() as db:
        inserted, updated = sync(db, entries)
    print(f"sync complete from {path}: {inserted} inserted, {updated} updated, total {len(entries)}")


if __name__ == "__main__":
    main()