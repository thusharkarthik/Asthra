"""scoped membership foundation

Revision ID: 0013_scoped_membership_foundation
Revises: 0012_access_control_foundation
Create Date: 2026-06-19
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists, column_exists


revision: str = "0013_scoped_membership_foundation"
down_revision: str | None = "0012_access_control_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("role_assignments"):
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
    if not index_exists("role_assignments", op.f("ix_role_assignments_id")):
        op.create_index(op.f("ix_role_assignments_id"), "role_assignments", ["id"], unique=False)
    if not index_exists("role_assignments", op.f("ix_role_assignments_role_id")):
        op.create_index(op.f("ix_role_assignments_role_id"), "role_assignments", ["role_id"], unique=False)
    if not index_exists("role_assignments", op.f("ix_role_assignments_scope_id")):
        op.create_index(op.f("ix_role_assignments_scope_id"), "role_assignments", ["scope_id"], unique=False)
    if not index_exists("role_assignments", op.f("ix_role_assignments_scope_type")):
        op.create_index(op.f("ix_role_assignments_scope_type"), "role_assignments", ["scope_type"], unique=False)
    if not index_exists("role_assignments", op.f("ix_role_assignments_status")):
        op.create_index(op.f("ix_role_assignments_status"), "role_assignments", ["status"], unique=False)
    if not index_exists("role_assignments", op.f("ix_role_assignments_user_id")):
        op.create_index(op.f("ix_role_assignments_user_id"), "role_assignments", ["user_id"], unique=False)

    if not table_exists("project_memberships"):
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
    if not index_exists("project_memberships", op.f("ix_project_memberships_id")):
        op.create_index(op.f("ix_project_memberships_id"), "project_memberships", ["id"], unique=False)
    if not index_exists("project_memberships", op.f("ix_project_memberships_project_id")):
        op.create_index(op.f("ix_project_memberships_project_id"), "project_memberships", ["project_id"], unique=False)
    if not index_exists("project_memberships", op.f("ix_project_memberships_status")):
        op.create_index(op.f("ix_project_memberships_status"), "project_memberships", ["status"], unique=False)
    if not index_exists("project_memberships", op.f("ix_project_memberships_user_id")):
        op.create_index(op.f("ix_project_memberships_user_id"), "project_memberships", ["user_id"], unique=False)

    if table_exists("team_members"):
        with op.batch_alter_table("team_members") as batch_op:
            if not column_exists("team_members", "status"):
                batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="active"))
            if not column_exists("team_members", "joined_at"):
                batch_op.add_column(sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True))
            if not index_exists("team_members", op.f("ix_team_members_status")):
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
