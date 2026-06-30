"""scoped membership foundation

Revision ID: 0013_scoped_membership_foundation
Revises: 0012_access_control_foundation
Create Date: 2026-06-19
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0013_scoped_membership_foundation"
down_revision: str | None = "0012_access_control_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _inspector():
    return inspect(op.get_bind())


def _table_exists(table_name: str) -> bool:
    return table_name in _inspector().get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return column_name in {column["name"] for column in _inspector().get_columns(table_name)}


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return index_name in {index["name"] for index in _inspector().get_indexes(table_name)}


def _create_index_if_missing(table_name: str, index_name: str, columns: list[str]) -> None:
    if _table_exists(table_name) and not _index_exists(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=False)


def upgrade() -> None:
    if not _table_exists("role_assignments"):
        op.create_table(
            "role_assignments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=False),
            sa.Column("scope_type", sa.String(length=50), nullable=False),
            sa.Column("scope_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
            sa.Column("assigned_by", sa.Integer(), nullable=True),
            sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["assigned_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "role_id", "scope_type", "scope_id", name="uq_role_assignment_scope"),
        )
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_id"), ["id"])
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_role_id"), ["role_id"])
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_scope_id"), ["scope_id"])
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_scope_type"), ["scope_type"])
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_status"), ["status"])
    _create_index_if_missing("role_assignments", op.f("ix_role_assignments_user_id"), ["user_id"])

    if not _table_exists("project_memberships"):
        op.create_table(
            "project_memberships",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=True),
            sa.Column("team_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
            sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("project_id", "user_id"),
        )
    _create_index_if_missing("project_memberships", op.f("ix_project_memberships_id"), ["id"])
    _create_index_if_missing("project_memberships", op.f("ix_project_memberships_project_id"), ["project_id"])
    _create_index_if_missing("project_memberships", op.f("ix_project_memberships_status"), ["status"])
    _create_index_if_missing("project_memberships", op.f("ix_project_memberships_user_id"), ["user_id"])

    if _table_exists("team_members"):
        with op.batch_alter_table("team_members") as batch_op:
            if not _column_exists("team_members", "status"):
                batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="active"))
            if not _column_exists("team_members", "joined_at"):
                batch_op.add_column(sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True))
            if not _index_exists("team_members", op.f("ix_team_members_status")):
                batch_op.create_index(batch_op.f("ix_team_members_status"), ["status"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("team_members") as batch_op:
        batch_op.drop_index(batch_op.f("ix_team_members_status"))
        batch_op.drop_column("joined_at")
        batch_op.drop_column("status")

    op.drop_index(op.f("ix_project_memberships_user_id"), table_name="project_memberships")
    op.drop_index(op.f("ix_project_memberships_status"), table_name="project_memberships")
    op.drop_index(op.f("ix_project_memberships_project_id"), table_name="project_memberships")
    op.drop_index(op.f("ix_project_memberships_id"), table_name="project_memberships")
    op.drop_table("project_memberships")

    op.drop_index(op.f("ix_role_assignments_user_id"), table_name="role_assignments")
    op.drop_index(op.f("ix_role_assignments_status"), table_name="role_assignments")
    op.drop_index(op.f("ix_role_assignments_scope_type"), table_name="role_assignments")
    op.drop_index(op.f("ix_role_assignments_scope_id"), table_name="role_assignments")
    op.drop_index(op.f("ix_role_assignments_role_id"), table_name="role_assignments")
    op.drop_index(op.f("ix_role_assignments_id"), table_name="role_assignments")
    op.drop_table("role_assignments")
