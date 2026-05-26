"""team management fields

Revision ID: 0004_team_management_fields
Revises: 0003_organization_management_fields
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004_team_management_fields"
down_revision: str | None = "0003_organization_management_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("teams") as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("created_by_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.create_foreign_key(
            "fk_teams_created_by_id_users",
            "users",
            ["created_by_id"],
            ["id"],
        )

    with op.batch_alter_table("team_members") as batch_op:
        batch_op.add_column(
            sa.Column("member_role", sa.String(length=50), nullable=False, server_default="member"),
        )


def downgrade() -> None:
    with op.batch_alter_table("team_members") as batch_op:
        batch_op.drop_column("member_role")

    with op.batch_alter_table("teams") as batch_op:
        batch_op.drop_constraint("fk_teams_created_by_id_users", type_="foreignkey")
        batch_op.drop_column("is_active")
        batch_op.drop_column("created_by_id")
        batch_op.drop_column("description")
