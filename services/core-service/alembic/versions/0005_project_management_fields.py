"""project management fields

Revision ID: 0005_project_management_fields
Revises: 0004_team_management_fields
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0005_project_management_fields"
down_revision: str | None = "0004_team_management_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("projects") as batch_op:
        batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="active"))
        batch_op.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("created_by_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.create_foreign_key("fk_projects_owner_id_users", "users", ["owner_id"], ["id"])
        batch_op.create_foreign_key("fk_projects_created_by_id_users", "users", ["created_by_id"], ["id"])

    if not table_exists("project_teams"):
        op.create_table(
            "project_teams",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("project_id", "team_id"),
        )
    if not index_exists("project_teams", op.f("ix_project_teams_id")):
        op.create_index(op.f("ix_project_teams_id"), "project_teams", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_teams_id"), table_name="project_teams")
    op.drop_table("project_teams")

    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_constraint("fk_projects_created_by_id_users", type_="foreignkey")
        batch_op.drop_constraint("fk_projects_owner_id_users", type_="foreignkey")
        batch_op.drop_column("is_active")
        batch_op.drop_column("created_by_id")
        batch_op.drop_column("owner_id")
        batch_op.drop_column("status")
