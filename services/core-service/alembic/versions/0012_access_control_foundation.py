"""access control foundation

Revision ID: 0012_access_control_foundation
Revises: 0011_core_api_keys
Create Date: 2026-06-19
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0012_access_control_foundation"
down_revision: str | None = "0011_core_api_keys"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("permissions") as batch_op:
        batch_op.add_column(sa.Column("module", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("scope", sa.String(length=50), nullable=False, server_default="workspace"))
        batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="active"))

    with op.batch_alter_table("roles") as batch_op:
        batch_op.add_column(sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column("is_editable", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    with op.batch_alter_table("roles") as batch_op:
        batch_op.drop_column("is_editable")
        batch_op.drop_column("is_system")

    with op.batch_alter_table("permissions") as batch_op:
        batch_op.drop_column("status")
        batch_op.drop_column("scope")
        batch_op.drop_column("module")
