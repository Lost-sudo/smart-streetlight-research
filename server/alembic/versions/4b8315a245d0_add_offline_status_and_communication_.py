"""add offline status and communication repair task type

Revision ID: 4b8315a245d0
Revises: e8d5a499d04b
Create Date: 2026-05-12 01:03:12.141198

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b8315a245d0'
down_revision: Union[str, Sequence[str], None] = 'e8d5a499d04b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Manually added: Add new enum values to Postgres types
    # We use commit because ALTER TYPE ... ADD VALUE cannot run in a transaction block
    op.execute("COMMIT")
    op.execute("ALTER TYPE streetlight_status_enum ADD VALUE 'offline'")
    op.execute("ALTER TYPE repair_task_source_type_enum ADD VALUE 'COMMUNICATION'")

def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL does not support removing values from an ENUM type.
    # To downgrade, one would typically have to recreate the entire type or leave the values.
    pass
