"""add perf indexes for progress/quiz/leaderboard hot paths

Revision ID: c5d6e7f8a9b0
Revises: b3c4d5e6f7a8
Create Date: 2026-10-05

Fixes 15-20s first-login + per-reload stalls on high-latency DBs by indexing
every WHERE/JOIN used in ensure_progress_rows, bfs_unlock, passed_quiz,
get_user_progress, get_leaderboard and article detail.
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_uap_user_status", "user_article_progress", ["user_id", "status"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_quiz_attempts_user_question", "quiz_attempts", ["user_id", "question_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_leagues_week", "leagues", ["week_start"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_quiz_questions_article_active", "quiz_questions", ["article_id", "active"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_articles_part", "articles", ["part_number"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("ix_uap_user_status", table_name="user_article_progress")
    op.drop_index("ix_quiz_attempts_user_question", table_name="quiz_attempts")
    op.drop_index("ix_leagues_week", table_name="leagues")
    op.drop_index("ix_quiz_questions_article_active", table_name="quiz_questions")
    op.drop_index("ix_articles_part", table_name="articles")
