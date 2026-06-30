"""invitations membership

Revision ID: 0008_invitations_membership
Revises: 0007_activity_audit_logs
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from app.db.migration_utils import table_exists, index_exists


revision: str = "0008_invitations_membership"
down_revision: str | None = "0007_activity_audit_logs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not table_exists("invitations"):
        op.create_table(
            "invitations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=True),
            sa.Column("invited_by_id", sa.Integer(), nullable=False),
            sa.Column("role_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("token", sa.String(length=255), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["invited_by_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("email", "organization_id", "workspace_id", "status"),
        )
    if not index_exists("invitations", op.f("ix_invitations_email")):
        op.create_index(op.f("ix_invitations_email"), "invitations", ["email"], unique=False)
    if not index_exists("invitations", op.f("ix_invitations_id")):
        op.create_index(op.f("ix_invitations_id"), "invitations", ["id"], unique=False)
    if not index_exists("invitations", op.f("ix_invitations_token")):
        op.create_index(op.f("ix_invitations_token"), "invitations", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_invitations_token"), table_name="invitations")
    op.drop_index(op.f("ix_invitations_id"), table_name="invitations")
    op.drop_index(op.f("ix_invitations_email"), table_name="invitations")
    op.drop_table("invitations")
