from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.services.permission_service import PermissionService
from app.services.role_service import RoleService


def initialize_access_control(engine: Engine, db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_rbac_columns(engine)
    PermissionService(db).ensure_permission_catalog()
    RoleService(db).ensure_role_catalog()


def _ensure_rbac_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "permissions" not in table_names or "roles" not in table_names:
        return

    permission_columns = {column["name"] for column in inspector.get_columns("permissions")}
    role_columns = {column["name"] for column in inspector.get_columns("roles")}
    dialect = engine.dialect.name

    with engine.begin() as connection:
        if "module" not in permission_columns:
            connection.execute(text("ALTER TABLE permissions ADD COLUMN module VARCHAR(100)"))
        if "scope" not in permission_columns:
            connection.execute(text("ALTER TABLE permissions ADD COLUMN scope VARCHAR(50) DEFAULT 'workspace' NOT NULL"))
        if "status" not in permission_columns:
            connection.execute(text("ALTER TABLE permissions ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL"))

        false_default = "0" if dialect == "sqlite" else "false"
        true_default = "1" if dialect == "sqlite" else "true"
        if "is_system" not in role_columns:
            connection.execute(text(f"ALTER TABLE roles ADD COLUMN is_system BOOLEAN DEFAULT {false_default} NOT NULL"))
        if "is_editable" not in role_columns:
            connection.execute(text(f"ALTER TABLE roles ADD COLUMN is_editable BOOLEAN DEFAULT {true_default} NOT NULL"))
