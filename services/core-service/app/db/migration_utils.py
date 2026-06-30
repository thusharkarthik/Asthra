"""Idempotency helpers for Alembic migrations.

All migrations that create tables or indexes must use these guards so that
re-running a migration (due to alembic_version drift) never crashes with
"table already exists" or "index already exists".

Usage in a migration file:
    from app.db.migration_utils import table_exists, index_exists, column_exists

    def upgrade() -> None:
        if not table_exists("my_table"):
            op.create_table("my_table", ...)
        if not index_exists("my_table", op.f("ix_my_table_id")):
            op.create_index(op.f("ix_my_table_id"), "my_table", ["id"])
"""

from alembic import op
from sqlalchemy import inspect


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def index_exists(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    existing = [idx["name"] for idx in inspector.get_indexes(table_name)]
    return index_name in existing


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns
