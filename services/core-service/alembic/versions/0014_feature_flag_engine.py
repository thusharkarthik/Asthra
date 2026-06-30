"""feature flag engine

Revision ID: 0014_feature_flag_engine
Revises: 0013_scoped_membership_foundation
Create Date: 2026-06-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0014_feature_flag_engine"
down_revision: str | None = "0013_scoped_membership_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("feature_flags"):
        op.create_table(
            "feature_flags",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("flag_key", sa.String(length=150), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=False, server_default="general"),
            sa.Column("default_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("flag_key"),
        )
    if not index_exists("feature_flags", op.f("ix_feature_flags_id")):
        op.create_index(op.f("ix_feature_flags_id"), "feature_flags", ["id"], unique=False)
    if not index_exists("feature_flags", op.f("ix_feature_flags_flag_key")):
        op.create_index(op.f("ix_feature_flags_flag_key"), "feature_flags", ["flag_key"], unique=True)
    if not index_exists("feature_flags", op.f("ix_feature_flags_category")):
        op.create_index(op.f("ix_feature_flags_category"), "feature_flags", ["category"], unique=False)

    if not table_exists("feature_flag_overrides"):
        op.create_table(
            "feature_flag_overrides",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("flag_key", sa.String(length=150), nullable=False),
            sa.Column("scope_type", sa.String(length=50), nullable=False),
            sa.Column("scope_id", sa.Integer(), nullable=True),
            sa.Column("enabled", sa.Boolean(), nullable=False),
            sa.Column("reason", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["flag_key"], ["feature_flags.flag_key"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("flag_key", "scope_type", "scope_id", name="uq_feature_flag_override_scope"),
        )
    if not index_exists("feature_flag_overrides", op.f("ix_feature_flag_overrides_id")):
        op.create_index(op.f("ix_feature_flag_overrides_id"), "feature_flag_overrides", ["id"], unique=False)
    if not index_exists("feature_flag_overrides", op.f("ix_feature_flag_overrides_flag_key")):
        op.create_index(op.f("ix_feature_flag_overrides_flag_key"), "feature_flag_overrides", ["flag_key"], unique=False)
    if not index_exists("feature_flag_overrides", op.f("ix_feature_flag_overrides_scope_type")):
        op.create_index(op.f("ix_feature_flag_overrides_scope_type"), "feature_flag_overrides", ["scope_type"], unique=False)
    if not index_exists("feature_flag_overrides", op.f("ix_feature_flag_overrides_scope_id")):
        op.create_index(op.f("ix_feature_flag_overrides_scope_id"), "feature_flag_overrides", ["scope_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_feature_flag_overrides_scope_id"), table_name="feature_flag_overrides")
    op.drop_index(op.f("ix_feature_flag_overrides_scope_type"), table_name="feature_flag_overrides")
    op.drop_index(op.f("ix_feature_flag_overrides_flag_key"), table_name="feature_flag_overrides")
    op.drop_index(op.f("ix_feature_flag_overrides_id"), table_name="feature_flag_overrides")
    op.drop_table("feature_flag_overrides")

    op.drop_index(op.f("ix_feature_flags_category"), table_name="feature_flags")
    op.drop_index(op.f("ix_feature_flags_flag_key"), table_name="feature_flags")
    op.drop_index(op.f("ix_feature_flags_id"), table_name="feature_flags")
    op.drop_table("feature_flags")
