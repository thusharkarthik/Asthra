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
    dialect = engine.dialect.name

    with engine.begin() as connection:
        false_default = "0" if dialect == "sqlite" else "false"
        true_default = "1" if dialect == "sqlite" else "true"

        if "permissions" in table_names:
            permission_columns = {column["name"] for column in inspector.get_columns("permissions")}
            if "module" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN module VARCHAR(100)"))
            if "resource" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN resource VARCHAR(100)"))
            if "action" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN action VARCHAR(100)"))
            if "scope" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN scope VARCHAR(50) DEFAULT 'workspace' NOT NULL"))
            if "risk_level" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN risk_level VARCHAR(50) DEFAULT 'low' NOT NULL"))
            if "source" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN source VARCHAR(50) DEFAULT 'custom' NOT NULL"))
            if "status" not in permission_columns:
                connection.execute(text("ALTER TABLE permissions ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL"))

        if "roles" in table_names:
            role_columns = {column["name"] for column in inspector.get_columns("roles")}
            if "is_system" not in role_columns:
                connection.execute(text(f"ALTER TABLE roles ADD COLUMN is_system BOOLEAN DEFAULT {false_default} NOT NULL"))
            if "is_editable" not in role_columns:
                connection.execute(text(f"ALTER TABLE roles ADD COLUMN is_editable BOOLEAN DEFAULT {true_default} NOT NULL"))

        for table_name in ("organizations", "workspaces", "projects"):
            if table_name not in table_names:
                continue
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "context_version" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN context_version INTEGER DEFAULT 1 NOT NULL"))
            if "access_version" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN access_version INTEGER DEFAULT 1 NOT NULL"))

        if "team_members" in table_names:
            team_member_columns = {column["name"] for column in inspector.get_columns("team_members")}
            if "status" not in team_member_columns:
                connection.execute(text("ALTER TABLE team_members ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL"))
            if "joined_at" not in team_member_columns:
                connection.execute(text("ALTER TABLE team_members ADD COLUMN joined_at DATETIME"))
