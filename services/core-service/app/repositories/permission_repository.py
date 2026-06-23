from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.schemas.role import PermissionUpdate


class PermissionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, permission_id: int) -> Permission | None:
        return self.db.get(Permission, permission_id)

    def get_by_code(self, code: str) -> Permission | None:
        statement = select(Permission).where(Permission.code == code)
        return self.db.scalar(statement)

    def list(self, *, include_inactive: bool = False) -> list[Permission]:
        statement = select(Permission).order_by(Permission.created_at.desc())
        if not include_inactive:
            statement = statement.where(Permission.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        code: str,
        name: str,
        description: str | None,
        module: str | None = None,
        resource: str | None = None,
        action: str | None = None,
        scope: str = "workspace",
        risk_level: str = "low",
        source: str = "custom",
        status: str = "active",
        is_system: bool = False,
    ) -> Permission:
        permission = Permission(
            code=code,
            key=code,
            name=name,
            description=description,
            module=module,
            resource=resource,
            action=action,
            scope=scope,
            risk_level=risk_level,
            source=source,
            status=status,
            is_system=is_system,
            is_active=status == "active",
        )
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def update(self, permission: Permission, permission_update: PermissionUpdate) -> Permission:
        update_data = permission_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(permission, field, value)
        if "code" in update_data:
            permission.key = update_data["code"]
        if "status" in update_data and "is_active" not in update_data:
            permission.is_active = update_data["status"] == "active"
        if "is_active" in update_data and "status" not in update_data:
            permission.status = "active" if update_data["is_active"] else "inactive"
        self.db.commit()
        self.db.refresh(permission)
        return permission
