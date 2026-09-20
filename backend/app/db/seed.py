"""Copy content tables from the legacy SQLite DB into PostgreSQL (one-time seed).

Idempotent: upserts by natural key.
"""
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.db.models import (
    Article,
    ArticleDependency,
    Clause,
    QuizQuestion,
    SubClause,
)
from app.db.session import SessionLocal

SQLITE_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../db/constitution.db"))


def load_sqlite():
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    return conn


def seed(db: Session):
    conn = load_sqlite()

    # Articles
    rows = conn.execute(
        "SELECT id, article_number, title, part_number, part_title FROM articles ORDER BY CAST(article_number AS INTEGER)"
    ).fetchall()
    for r in rows:
        db.merge(
            Article(
                id=r["id"],
                article_number=int(r["article_number"]),
                title=r["title"],
                part_number=int(r["part_number"]),
                part_title=r["part_title"],
            )
        )
    print(f"Articles: {len(rows)}")

    # Clauses
    rows = conn.execute("SELECT id, article_id, clause_number, content FROM clauses").fetchall()
    clause_id_map = {}
    for r in rows:
        obj = Clause(article_id=r["article_id"], clause_number=int(r["clause_number"]), content=r["content"])
        db.add(obj)
        db.flush()
        clause_id_map[r["id"]] = obj.id
    print(f"Clauses: {len(rows)}")

    # Sub-clauses
    rows = conn.execute("SELECT clause_id, identifier, content FROM sub_clauses").fetchall()
    for r in rows:
        db.add(SubClause(clause_id=clause_id_map[r["clause_id"]], identifier=r["identifier"], content=r["content"]))
    print(f"Sub-clauses: {len(rows)}")

    # Dependencies
    rows = conn.execute(
        "SELECT source_id, target_id, relation_type FROM article_dependencies"
    ).fetchall()
    for r in rows:
        db.merge(
            ArticleDependency(
                source_id=r["source_id"],
                target_id=r["target_id"],
                relation_type=r["relation_type"],
            )
        )
    print(f"Dependencies: {len(rows)}")

    # Quiz questions
    rows = conn.execute(
        """SELECT article_id, question_text, option_a, option_b, option_c, option_d,
                  correct_option, explanation, difficulty, knowledge_type
           FROM quiz_questions"""
    ).fetchall()
    for r in rows:
        db.add(
            QuizQuestion(
                article_id=r["article_id"],
                question_text=r["question_text"],
                option_a=r["option_a"],
                option_b=r["option_b"],
                option_c=r["option_c"],
                option_d=r["option_d"],
                correct_option=r["correct_option"],
                explanation=r["explanation"],
                difficulty=r["difficulty"],
                knowledge_type=r["knowledge_type"],
            )
        )
    print(f"Quiz questions: {len(rows)}")

    conn.close()
    db.commit()


if __name__ == "__main__":
    with SessionLocal() as db:
        seed(db)
    print("Seed complete.")