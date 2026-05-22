"""add confidence column to streetlight_logs

Revision ID: 1674136e4a7d
Revises: 4b8315a245d0
Create Date: 2026-05-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1674136e4a7d'
down_revision: Union[str, Sequence[str], None] = '4b8315a245d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('streetlight_logs', sa.Column('confidence', sa.Float(), nullable=True, server_default=sa.text('0.5')))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('streetlight_logs', 'confidence')
