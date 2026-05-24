"""Add 10-step rolling window features, drop 5-step

Revision ID: 5a6b7c8d9e0f
Revises: 1674136e4a7d
Create Date: 2026-05-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a6b7c8d9e0f'
down_revision: Union[str, Sequence[str], None] = '1674136e4a7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new 10-step columns
    op.add_column('streetlight_logs', sa.Column('std_voltage_10', sa.Float(), nullable=True))
    op.add_column('streetlight_logs', sa.Column('std_current_10', sa.Float(), nullable=True))
    # Migrate existing data
    op.execute("UPDATE streetlight_logs SET std_voltage_10 = std_voltage_5, std_current_10 = std_current_5")
    # Drop old 5-step columns
    op.drop_column('streetlight_logs', 'std_current_5')
    op.drop_column('streetlight_logs', 'std_voltage_5')


def downgrade() -> None:
    # Restore old 5-step columns
    op.add_column('streetlight_logs', sa.Column('std_voltage_5', sa.Float(), nullable=True))
    op.add_column('streetlight_logs', sa.Column('std_current_5', sa.Float(), nullable=True))
    # Migrate data back
    op.execute("UPDATE streetlight_logs SET std_voltage_5 = std_voltage_10, std_current_5 = std_current_10")
    # Drop new 10-step columns
    op.drop_column('streetlight_logs', 'std_current_10')
    op.drop_column('streetlight_logs', 'std_voltage_10')
