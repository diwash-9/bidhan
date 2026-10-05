"""raise hearts cap to 25 with 3-minute refills

Revision ID: d6e7f8a9b0c1
Revises: c5d6e7f8a9b0
Create Date: 2026-10-05

Hearts tuning: max 10 -> 25, refill interval 30 min -> 3 min per heart
(code constants in app/services/gamif_service.py).
One-time generous migration: raise the cap for everyone and fill up to the
new cap, resetting the refill timer cleanly (same precedent as b3c4d5e6f7a8).
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'd6e7f8a9b0c1'
down_revision: Union[str, None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE hearts SET max_hearts = 25, hearts_left = GREATEST(hearts_left, 25), last_refill_ts = NULL "
        "WHERE max_hearts < 25 OR hearts_left < 25"
    )


def downgrade() -> None:
    op.execute("UPDATE hearts SET max_hearts = 10, hearts_left = LEAST(hearts_left, 10), last_refill_ts = NULL")
