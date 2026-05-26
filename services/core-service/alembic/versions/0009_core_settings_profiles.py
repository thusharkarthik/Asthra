"""core settings profiles

Revision ID: 0009_core_settings_profiles
Revises: 0008_invitations_membership
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0009_core_settings_profiles"
down_revision: str | None = "0008_invitations_membership"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("avatar_url", sa.String(length=1000), nullable=True))
        batch_op.add_column(sa.Column("job_title", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("timezone", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("locale", sa.String(length=50), nullable=True))

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(sa.Column("settings", sa.JSON(), nullable=True))

    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.add_column(sa.Column("settings", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("workspaces") as batch_op:
        batch_op.drop_column("settings")

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_column("settings")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("locale")
        batch_op.drop_column("timezone")
        batch_op.drop_column("job_title")
        batch_op.drop_column("avatar_url")
