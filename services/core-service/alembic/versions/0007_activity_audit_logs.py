"""activity audit logs

Revision ID: 0007_activity_audit_logs
Revises: 0006_role_permission_management
Create Date: 2026-05-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0007_activity_audit_logs"
down_revision: str | None = "0006_role_permission_management"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("activity_logs") as batch_op:
        batch_op.add_column(sa.Column("project_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("metadata", sa.JSON(), nullable=True))
        batch_op.create_foreign_key(
            "fk_activity_logs_project_id_projects",
            "projects",
            ["project_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("activity_logs") as batch_op:
        batch_op.drop_constraint("fk_activity_logs_project_id_projects", type_="foreignkey")
        batch_op.drop_column("metadata")
        batch_op.drop_column("description")
        batch_op.drop_column("project_id")
