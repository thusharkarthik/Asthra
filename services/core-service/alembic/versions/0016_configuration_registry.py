"""configuration registry

Revision ID: 0016_configuration_registry
Revises: 0015_module_registry
Create Date: 2026-06-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import index_exists, table_exists


revision: str = "0016_configuration_registry"
down_revision: str | None = "0015_module_registry"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("configuration_definitions"):
        op.create_table(
            "configuration_definitions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("config_key", sa.String(length=150), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=False, server_default="general"),
            sa.Column("source_module", sa.String(length=100), nullable=False, server_default="core"),
            sa.Column("value_type", sa.String(length=50), nullable=False),
            sa.Column("default_value", sa.JSON(), nullable=True),
            sa.Column("allowed_values", sa.JSON(), nullable=True),
            sa.Column("is_secret", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("supports_inheritance", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("config_key"),
        )
    if not index_exists("configuration_definitions", op.f("ix_configuration_definitions_id")):
        op.create_index(op.f("ix_configuration_definitions_id"), "configuration_definitions", ["id"], unique=False)
    if not index_exists("configuration_definitions", op.f("ix_configuration_definitions_config_key")):
        op.create_index(op.f("ix_configuration_definitions_config_key"), "configuration_definitions", ["config_key"], unique=True)
    if not index_exists("configuration_definitions", op.f("ix_configuration_definitions_category")):
        op.create_index(op.f("ix_configuration_definitions_category"), "configuration_definitions", ["category"], unique=False)
    if not index_exists("configuration_definitions", op.f("ix_configuration_definitions_source_module")):
        op.create_index(op.f("ix_configuration_definitions_source_module"), "configuration_definitions", ["source_module"], unique=False)

    if not table_exists("configuration_values"):
        op.create_table(
            "configuration_values",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("config_key", sa.String(length=150), nullable=False),
            sa.Column("scope_type", sa.String(length=50), nullable=False),
            sa.Column("scope_id", sa.Integer(), nullable=True),
            sa.Column("value", sa.JSON(), nullable=True),
            sa.Column("reason", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("updated_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["config_key"], ["configuration_definitions.config_key"]),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["updated_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("config_key", "scope_type", "scope_id", name="uq_configuration_value_scope"),
        )
    if not index_exists("configuration_values", op.f("ix_configuration_values_id")):
        op.create_index(op.f("ix_configuration_values_id"), "configuration_values", ["id"], unique=False)
    if not index_exists("configuration_values", op.f("ix_configuration_values_config_key")):
        op.create_index(op.f("ix_configuration_values_config_key"), "configuration_values", ["config_key"], unique=False)
    if not index_exists("configuration_values", op.f("ix_configuration_values_scope_type")):
        op.create_index(op.f("ix_configuration_values_scope_type"), "configuration_values", ["scope_type"], unique=False)
    if not index_exists("configuration_values", op.f("ix_configuration_values_scope_id")):
        op.create_index(op.f("ix_configuration_values_scope_id"), "configuration_values", ["scope_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_configuration_values_scope_id"), table_name="configuration_values")
    op.drop_index(op.f("ix_configuration_values_scope_type"), table_name="configuration_values")
    op.drop_index(op.f("ix_configuration_values_config_key"), table_name="configuration_values")
    op.drop_index(op.f("ix_configuration_values_id"), table_name="configuration_values")
    op.drop_table("configuration_values")
    op.drop_index(op.f("ix_configuration_definitions_source_module"), table_name="configuration_definitions")
    op.drop_index(op.f("ix_configuration_definitions_category"), table_name="configuration_definitions")
    op.drop_index(op.f("ix_configuration_definitions_config_key"), table_name="configuration_definitions")
    op.drop_index(op.f("ix_configuration_definitions_id"), table_name="configuration_definitions")
    op.drop_table("configuration_definitions")
