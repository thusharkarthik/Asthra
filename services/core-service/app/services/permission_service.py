from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.role import PermissionCreate, PermissionUpdate
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.permission_registry import iter_registry_permissions

VALID_PERMISSION_STATUSES = {"active", "inactive", "deprecated"}
VALID_PERMISSION_RISK_LEVELS = {"low", "medium", "high"}
VALID_PERMISSION_SOURCES = {"registry", "custom"}


class PermissionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.permission_repository = PermissionRepository(db)

    def create(self, permission_create: PermissionCreate, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        self._require_permission_manage(current_user)
        code = self._normalize_code(permission_create.code)
        self._validate_status(permission_create.status)
        self._validate_risk_level(permission_create.risk_level)
        self._validate_source(permission_create.source)
        if self.permission_repository.get_by_code(code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A permission with this code already exists.",
            )
        permission = self.permission_repository.create(
            code=code,
            name=permission_create.name.strip(),
            description=permission_create.description,
            module=permission_create.module,
            resource=permission_create.resource,
            action=permission_create.action,
            scope=permission_create.scope,
            risk_level=permission_create.risk_level,
            source=permission_create.source,
            status=permission_create.status,
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="permission",
            entity_id=str(permission.id),
            action="permission.created",
            description=f"Permission '{permission.code}' was created.",
        )
        ContextVersionService(self.db).bump_access("platform", None)
        self.db.commit()
        return permission

    def list(self, current_user: User) -> list[Permission]:
        self._ensure_active_user(current_user)
        self.ensure_permission_catalog()
        return self.permission_repository.list()

    def get(self, permission_id: int, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        permission = self.permission_repository.get_by_id(permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        return permission

    def update(
        self,
        permission_id: int,
        permission_update: PermissionUpdate,
        current_user: User,
    ) -> Permission:
        permission = self.get(permission_id, current_user)
        self._require_permission_manage(current_user)
        if permission_update.code is not None:
            permission_update.code = self._normalize_code(permission_update.code)
            duplicate = self.permission_repository.get_by_code(permission_update.code)
            if duplicate is not None and duplicate.id != permission.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A permission with this code already exists.",
                )
        if permission_update.name is not None:
            permission_update.name = permission_update.name.strip()
        if permission_update.status is not None:
            self._validate_status(permission_update.status)
        if permission_update.risk_level is not None:
            self._validate_risk_level(permission_update.risk_level)
        if permission_update.source is not None:
            self._validate_source(permission_update.source)
        permission = self.permission_repository.update(permission, permission_update)
        ContextVersionService(self.db).bump_access("platform", None)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def delete(self, permission_id: int, current_user: User) -> None:
        permission = self.get(permission_id, current_user)
        self._require_permission_manage(current_user)
        self.permission_repository.update(permission, PermissionUpdate(status="inactive", is_active=False))
        ContextVersionService(self.db).bump_access("platform", None)
        self.db.commit()

    def ensure_permission_catalog(self) -> None:
        registry_items = iter_registry_permissions()
        registry_codes = {item.code for item in registry_items}
        for item in registry_items:
            existing = self.permission_repository.get_by_code(item.code)
            if existing is not None:
                changed = False
                if existing.name != item.name:
                    existing.name = item.name
                    changed = True
                if existing.description != item.description:
                    existing.description = item.description
                    changed = True
                if existing.module != item.module:
                    existing.module = item.module
                    changed = True
                if existing.resource != item.resource:
                    existing.resource = item.resource
                    changed = True
                if existing.action != item.action:
                    existing.action = item.action
                    changed = True
                if existing.scope != item.scope:
                    existing.scope = item.scope
                    changed = True
                if existing.risk_level != item.risk_level:
                    existing.risk_level = item.risk_level
                    changed = True
                if existing.source != "registry":
                    existing.source = "registry"
                    changed = True
                if existing.status != "active":
                    existing.status = "active"
                    existing.is_active = True
                    changed = True
                if changed:
                    self.db.commit()
                continue
            self.permission_repository.create(
                code=item.code,
                name=item.name,
                description=item.description,
                module=item.module,
                resource=item.resource,
                action=item.action,
                scope=item.scope,
                risk_level=item.risk_level,
                source="registry",
                status="active",
            )
        for permission in self.permission_repository.list(include_inactive=True):
            if permission.source != "registry" or permission.code in registry_codes:
                continue
            if permission.status != "deprecated" or permission.is_active:
                permission.status = "deprecated"
                permission.is_active = False
                self.db.commit()

    def registry_status(self) -> list[dict]:
        self.ensure_permission_catalog()
        permissions_by_code = {permission.code: permission for permission in self.permission_repository.list(include_inactive=True)}
        rows: list[dict] = []
        for item in iter_registry_permissions():
            permission = permissions_by_code.get(item.code)
            rows.append({
                "code": item.code,
                "name": item.name,
                "description": item.description,
                "module": item.module,
                "resource": item.resource,
                "action": item.action,
                "scope": item.scope,
                "risk_level": item.risk_level,
                "exists": permission is not None,
                "status": permission.status if permission is not None else "missing",
            })
        return rows

    def permission_gaps(self) -> list[dict]:
        permissions_by_code = {permission.code: permission for permission in self.permission_repository.list(include_inactive=True)}
        gaps: list[dict] = []
        registry_codes = {item.code for item in iter_registry_permissions()}
        for item in iter_registry_permissions():
            permission = permissions_by_code.get(item.code)
            if permission is None or permission.status != "active" or not permission.is_active:
                gaps.append({
                    "module": item.module,
                    "resource": item.resource,
                    "action": item.action,
                    "expected_permission_code": item.code,
                    "status": "missing" if permission is None else permission.status,
                    "suggested_fix": "Run the permission registry sync on startup or reactivate the registry permission.",
                })
        for permission in permissions_by_code.values():
            if permission.source == "registry" and permission.code not in registry_codes:
                gaps.append({
                    "module": permission.module or permission.code.split(".")[0],
                    "resource": permission.resource or "unknown",
                    "action": permission.action or "unknown",
                    "expected_permission_code": permission.code,
                    "status": "deprecated",
                    "suggested_fix": "Review this registry permission and keep it deprecated unless a screen or endpoint still uses it.",
                })
        return gaps

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _require_permission_manage(self, user: User) -> None:
        from app.services.access_control_service import AccessControlService

        AccessControlService(self.db).require(
            user,
            "settings.permission.manage",
            "platform",
            None,
        )

    def _normalize_code(self, code: str) -> str:
        return code.strip().lower()

    def _validate_status(self, value: str) -> None:
        if value not in VALID_PERMISSION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Permission status must be active, inactive, or deprecated.",
            )

    def _validate_risk_level(self, value: str) -> None:
        if value not in VALID_PERMISSION_RISK_LEVELS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Permission risk level must be low, medium, or high.",
            )

    def _validate_source(self, value: str) -> None:
        if value not in VALID_PERMISSION_SOURCES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Permission source must be registry or custom.",
            )
