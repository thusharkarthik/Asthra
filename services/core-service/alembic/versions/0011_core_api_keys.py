"""core api keys

Revision ID: 0011_core_api_keys
Revises: 0010_core_notifications
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0011_core_api_keys"
down_revision: str | None = "0010_core_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("api_keys"):
        op.create_table(
            "api_keys",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=True),
            sa.Column("workspace_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("key_prefix", sa.String(length=32), nullable=False),
            sa.Column("hashed_key", sa.String(length=128), nullable=False),
            sa.Column("scopes", sa.JSON(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists("api_keys", op.f("ix_api_keys_id")):
        op.create_index(op.f("ix_api_keys_id"), "api_keys", ["id"], unique=False)
    if not index_exists("api_keys", op.f("ix_api_keys_key_prefix")):
        op.create_index(op.f("ix_api_keys_key_prefix"), "api_keys", ["key_prefix"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_api_keys_key_prefix"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_id"), table_name="api_keys")
    op.drop_table("api_keys")
