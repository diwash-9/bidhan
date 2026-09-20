"""bump hearts cap to 10

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-09-20 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Raise the cap for everyone and fill up to the new cap
    # (generous one-time migration; resets the refill timer cleanly).
    op.execute(
        "UPDATE hearts SET max_hearts = 10, hearts_left = GREATEST(hearts_left, 10), last_refill_ts = NULL "
        "WHERE max_hearts < 10 OR hearts_left < 10"
    )


def downgrade() -> None:
    op.execute("UPDATE hearts SET max_hearts = 5, hearts_left = LEAST(hearts_left, 5), last_refill_ts = NULL")