"""module registry

Revision ID: 0015_module_registry
Revises: 0014_feature_flag_engine
Create Date: 2026-06-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0015_module_registry"
down_revision: str | None = "0014_feature_flag_engine"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("module_registry"):
        op.create_table(
            "module_registry",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("module_key", sa.String(length=100), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=False, server_default="general"),
            sa.Column("route", sa.String(length=255), nullable=False),
            sa.Column("icon", sa.String(length=100), nullable=False),
            sa.Column("navigation_mode", sa.String(length=50), nullable=False),
            sa.Column("required_feature_flag", sa.String(length=150), nullable=True),
            sa.Column("required_permissions", sa.JSON(), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="1000"),
            sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("module_key"),
        )
    if not index_exists("module_registry", op.f("ix_module_registry_id")):
        op.create_index(op.f("ix_module_registry_id"), "module_registry", ["id"], unique=False)
    if not index_exists("module_registry", op.f("ix_module_registry_module_key")):
        op.create_index(op.f("ix_module_registry_module_key"), "module_registry", ["module_key"], unique=True)
    if not index_exists("module_registry", op.f("ix_module_registry_category")):
        op.create_index(op.f("ix_module_registry_category"), "module_registry", ["category"], unique=False)
    if not index_exists("module_registry", op.f("ix_module_registry_navigation_mode")):
        op.create_index(op.f("ix_module_registry_navigation_mode"), "module_registry", ["navigation_mode"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_module_registry_navigation_mode"), table_name="module_registry")
    op.drop_index(op.f("ix_module_registry_category"), table_name="module_registry")
    op.drop_index(op.f("ix_module_registry_module_key"), table_name="module_registry")
    op.drop_index(op.f("ix_module_registry_id"), table_name="module_registry")
    op.drop_table("module_registry")
