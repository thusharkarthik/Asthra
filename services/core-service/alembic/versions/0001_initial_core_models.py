"""initial core models

Revision ID: 0001_initial_core_models
Revises:
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0001_initial_core_models"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamp_columns() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    if not table_exists("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("full_name", sa.String(length=255), nullable=True),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("is_superuser", sa.Boolean(), nullable=False),
            *timestamp_columns(),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists("users", op.f("ix_users_id")):
        op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    if not index_exists("users", op.f("ix_users_email")):
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    if not table_exists("organizations"):
        op.create_table(
            "organizations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            *timestamp_columns(),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists("organizations", op.f("ix_organizations_id")):
        op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    if not index_exists("organizations", op.f("ix_organizations_slug")):
        op.create_index(op.f("ix_organizations_slug"), "organizations", ["slug"], unique=True)

    if not table_exists("roles"):
        op.create_table(
            "roles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("key", sa.String(length=100), nullable=False),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "key"),
        )
    if not index_exists("roles", op.f("ix_roles_id")):
        op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)

    if not table_exists("workspaces"):
        op.create_table(
            "workspaces",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "slug"),
        )
    if not index_exists("workspaces", op.f("ix_workspaces_id")):
        op.create_index(op.f("ix_workspaces_id"), "workspaces", ["id"], unique=False)
    if not index_exists("workspaces", op.f("ix_workspaces_slug")):
        op.create_index(op.f("ix_workspaces_slug"), "workspaces", ["slug"], unique=False)

    if not table_exists("organization_members"):
        op.create_table(
            "organization_members",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "user_id"),
        )
    if not index_exists("organization_members", op.f("ix_organization_members_id")):
        op.create_index(op.f("ix_organization_members_id"), "organization_members", ["id"], unique=False)

    if not table_exists("permissions"):
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=False),
            sa.Column("key", sa.String(length=150), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("role_id", "key"),
        )
    if not index_exists("permissions", op.f("ix_permissions_id")):
        op.create_index(op.f("ix_permissions_id"), "permissions", ["id"], unique=False)

    if not table_exists("teams"):
        op.create_table(
            "teams",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("workspace_id", "slug"),
        )
    if not index_exists("teams", op.f("ix_teams_id")):
        op.create_index(op.f("ix_teams_id"), "teams", ["id"], unique=False)
    if not index_exists("teams", op.f("ix_teams_slug")):
        op.create_index(op.f("ix_teams_slug"), "teams", ["slug"], unique=False)

    if not table_exists("workspace_members"):
        op.create_table(
            "workspace_members",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("workspace_id", "user_id"),
        )
    if not index_exists("workspace_members", op.f("ix_workspace_members_id")):
        op.create_index(op.f("ix_workspace_members_id"), "workspace_members", ["id"], unique=False)

    if not table_exists("team_members"):
        op.create_table(
            "team_members",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("team_id", "user_id"),
        )
    if not index_exists("team_members", op.f("ix_team_members_id")):
        op.create_index(op.f("ix_team_members_id"), "team_members", ["id"], unique=False)

    if not table_exists("projects"):
        op.create_table(
            "projects",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("key", sa.String(length=50), nullable=False),
            sa.Column("description", sa.String(length=1000), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("workspace_id", "key"),
        )
    if not index_exists("projects", op.f("ix_projects_id")):
        op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False)
    if not index_exists("projects", op.f("ix_projects_key")):
        op.create_index(op.f("ix_projects_key"), "projects", ["key"], unique=False)

    if not table_exists("activity_logs"):
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("actor_user_id", sa.Integer(), nullable=True),
            sa.Column("organization_id", sa.Integer(), nullable=True),
            sa.Column("workspace_id", sa.Integer(), nullable=True),
            sa.Column("action", sa.String(length=150), nullable=False),
            sa.Column("entity_type", sa.String(length=150), nullable=False),
            sa.Column("entity_id", sa.String(length=150), nullable=True),
            sa.Column("summary", sa.Text(), nullable=True),
            *timestamp_columns(),
            sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists("activity_logs", op.f("ix_activity_logs_id")):
        op.create_index(op.f("ix_activity_logs_id"), "activity_logs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_logs_id"), table_name="activity_logs")
    op.drop_table("activity_logs")
    op.drop_index(op.f("ix_projects_key"), table_name="projects")
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")
    op.drop_index(op.f("ix_team_members_id"), table_name="team_members")
    op.drop_table("team_members")
    op.drop_index(op.f("ix_workspace_members_id"), table_name="workspace_members")
    op.drop_table("workspace_members")
    op.drop_index(op.f("ix_teams_slug"), table_name="teams")
    op.drop_index(op.f("ix_teams_id"), table_name="teams")
    op.drop_table("teams")
    op.drop_index(op.f("ix_permissions_id"), table_name="permissions")
    op.drop_table("permissions")
    op.drop_index(op.f("ix_organization_members_id"), table_name="organization_members")
    op.drop_table("organization_members")
    op.drop_index(op.f("ix_workspaces_slug"), table_name="workspaces")
    op.drop_index(op.f("ix_workspaces_id"), table_name="workspaces")
    op.drop_table("workspaces")
    op.drop_index(op.f("ix_roles_id"), table_name="roles")
    op.drop_table("roles")
    op.drop_index(op.f("ix_organizations_slug"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_table("organizations")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
