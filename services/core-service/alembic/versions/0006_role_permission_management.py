"""role permission management

Revision ID: 0006_role_permission_management
Revises: 0005_project_management_fields
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0006_role_permission_management"
down_revision: str | None = "0005_project_management_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("roles") as batch_op:
        batch_op.alter_column("organization_id", existing_type=sa.Integer(), nullable=True)
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column("scope", sa.String(length=50), nullable=False, server_default="organization"),
        )
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.create_unique_constraint("uq_roles_scope_name", ["scope", "name"])

    with op.batch_alter_table("permissions") as batch_op:
        batch_op.alter_column("role_id", existing_type=sa.Integer(), nullable=True)
        batch_op.add_column(sa.Column("code", sa.String(length=150), nullable=False, server_default="legacy"))
        batch_op.add_column(sa.Column("name", sa.String(length=255), nullable=False, server_default="Legacy"))
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.alter_column("description", existing_type=sa.String(length=500), type_=sa.Text())
        batch_op.create_unique_constraint("uq_permissions_code", ["code"])

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_id", "permission_id"),
    )
    op.create_index(op.f("ix_role_permissions_id"), "role_permissions", ["id"], unique=False)

    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role_id"),
    )
    op.create_index(op.f("ix_user_roles_id"), "user_roles", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_roles_id"), table_name="user_roles")
    op.drop_table("user_roles")
    op.drop_index(op.f("ix_role_permissions_id"), table_name="role_permissions")
    op.drop_table("role_permissions")

    with op.batch_alter_table("permissions") as batch_op:
        batch_op.drop_constraint("uq_permissions_code", type_="unique")
        batch_op.alter_column("description", existing_type=sa.Text(), type_=sa.String(length=500))
        batch_op.drop_column("is_active")
        batch_op.drop_column("name")
        batch_op.drop_column("code")
        batch_op.alter_column("role_id", existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table("roles") as batch_op:
        batch_op.drop_constraint("uq_roles_scope_name", type_="unique")
        batch_op.drop_column("is_active")
        batch_op.drop_column("scope")
        batch_op.drop_column("description")
        batch_op.alter_column("organization_id", existing_type=sa.Integer(), nullable=False)
