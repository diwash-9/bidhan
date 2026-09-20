"""admin roles, quiz soft-delete, article revisions

Revision ID: a1b2c3d4e5f6
Revises: cc1dc85a5755
Create Date: 2026-09-20 21:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'cc1dc85a5755'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='user'))
    op.add_column('quiz_questions', sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_table(
        'article_revisions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('article_id', sa.String(length=10), nullable=False),
        sa.Column('changed_by', sa.String(length=36), nullable=False),
        sa.Column('amendment_date', sa.String(length=10), nullable=True),
        sa.Column('amendment_act', sa.String(length=255), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_article_revisions_article_id'), 'article_revisions', ['article_id'], unique=False)
    op.create_index(op.f('ix_article_revisions_changed_by'), 'article_revisions', ['changed_by'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_article_revisions_changed_by'), table_name='article_revisions')
    op.drop_index(op.f('ix_article_revisions_article_id'), table_name='article_revisions')
    op.drop_table('article_revisions')
    op.drop_column('quiz_questions', 'active')
    op.drop_column('users', 'role')