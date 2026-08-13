"""role navigation config foundation

Revision ID: 0017_role_navigation_config
Revises: 0016_configuration_registry
Create Date: 2026-08-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import index_exists, table_exists


revision: str = "0017_role_navigation_config"
down_revision: str | None = "0016_configuration_registry"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("role_navigation_configs"):
        op.create_table(
            "role_navigation_configs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=False),
            sa.Column("mode", sa.String(length=50), nullable=False),
            sa.Column("nav_key", sa.String(length=150), nullable=False),
            sa.Column("visibility", sa.String(length=50), nullable=False, server_default="default"),
            sa.Column("order_override", sa.Integer(), nullable=True),
            sa.Column("label_override", sa.String(length=255), nullable=True),
            sa.Column("group_override", sa.String(length=100), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("role_id", "mode", "nav_key", name="uq_role_navigation_config_role_mode_nav"),
        )
    if not index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_id")):
        op.create_index(op.f("ix_role_navigation_configs_id"), "role_navigation_configs", ["id"], unique=False)
    if not index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_role_id")):
        op.create_index(op.f("ix_role_navigation_configs_role_id"), "role_navigation_configs", ["role_id"], unique=False)
    if not index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_mode")):
        op.create_index(op.f("ix_role_navigation_configs_mode"), "role_navigation_configs", ["mode"], unique=False)
    if not index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_nav_key")):
        op.create_index(op.f("ix_role_navigation_configs_nav_key"), "role_navigation_configs", ["nav_key"], unique=False)


def downgrade() -> None:
    if table_exists("role_navigation_configs"):
        if index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_nav_key")):
            op.drop_index(op.f("ix_role_navigation_configs_nav_key"), table_name="role_navigation_configs")
        if index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_mode")):
            op.drop_index(op.f("ix_role_navigation_configs_mode"), table_name="role_navigation_configs")
        if index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_role_id")):
            op.drop_index(op.f("ix_role_navigation_configs_role_id"), table_name="role_navigation_configs")
        if index_exists("role_navigation_configs", op.f("ix_role_navigation_configs_id")):
            op.drop_index(op.f("ix_role_navigation_configs_id"), table_name="role_navigation_configs")
        op.drop_table("role_navigation_configs")
