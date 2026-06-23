from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role, RolePermission
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.role import PermissionCreate, PermissionUpdate
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.permission_registry import PermissionRegistryItem, iter_registry_permissions

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
            is_system=permission_create.is_system,
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
        self.normalize_permission_metadata()
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
                if not existing.is_system:
                    existing.is_system = True
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
                is_system=True,
            )

    def normalize_permission_metadata(self) -> None:
        registry_by_code = {item.code: item for item in iter_registry_permissions()}
        for permission in self.permission_repository.list(include_inactive=True):
            metadata = registry_by_code.get(permission.code) or self._metadata_from_code(permission.code)
            changed = False
            for field in ("module", "resource", "action", "scope", "risk_level"):
                value = getattr(metadata, field)
                if getattr(permission, field) != value:
                    setattr(permission, field, value)
                    changed = True
            if not permission.description:
                permission.description = metadata.description
                changed = True
            if not permission.name:
                permission.name = metadata.name
                changed = True
            expected_source = "registry" if permission.code in registry_by_code else (permission.source or "custom")
            if permission.source != expected_source:
                permission.source = expected_source
                changed = True
            expected_system = permission.code in registry_by_code
            if permission.is_system != expected_system and expected_system:
                permission.is_system = True
                changed = True
            if changed:
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
        self.normalize_permission_metadata()
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
            if not self._is_valid_permission_code(permission.code):
                gaps.append({
                    "module": permission.module or "unknown",
                    "resource": permission.resource or "unknown",
                    "action": permission.action or "unknown",
                    "expected_permission_code": permission.code,
                    "status": "malformed",
                    "suggested_fix": "Normalize the code to module.resource.action.",
                })
                continue
            if permission.action == "manage":
                gaps.append({
                    "module": permission.module or permission.code.split(".")[0],
                    "resource": permission.resource or "unknown",
                    "action": permission.action or "manage",
                    "expected_permission_code": permission.code,
                    "status": "broad",
                    "suggested_fix": "Review whether this broad manage permission should be split into precise action permissions.",
                })
            if permission.code not in registry_codes:
                gaps.append({
                    "module": permission.module or permission.code.split(".")[0],
                    "resource": permission.resource or "unknown",
                    "action": permission.action or "unknown",
                    "expected_permission_code": permission.code,
                    "status": "unmapped",
                    "suggested_fix": "Review whether this existing permission should be added to the Phase A registry baseline.",
                })
        return gaps

    def inventory(self) -> dict:
        self.ensure_permission_catalog()
        permissions = self.permission_repository.list(include_inactive=True)
        role_usage = self._role_usage_by_permission_id()
        registry_codes = {item.code for item in iter_registry_permissions()}
        malformed = [permission.code for permission in permissions if not self._is_valid_permission_code(permission.code)]
        duplicate_like = self._duplicate_like_permissions(permissions)
        unmapped = [permission.code for permission in permissions if not role_usage.get(permission.id)]

        return {
            "total_permissions": len(permissions),
            "by_module": self._count_by(permissions, "module"),
            "by_resource": self._count_by(permissions, "resource"),
            "by_action": self._count_by(permissions, "action"),
            "by_risk": self._count_by(permissions, "risk_level"),
            "by_scope": self._count_by(permissions, "scope"),
            "deprecated_permissions": [permission.code for permission in permissions if permission.status == "deprecated"],
            "malformed_permissions": malformed,
            "duplicate_like_permissions": duplicate_like,
            "unmapped_permissions": unmapped,
            "broad_permissions": [permission.code for permission in permissions if permission.action == "manage"],
            "existing_not_in_registry_baseline": [permission.code for permission in permissions if permission.code not in registry_codes],
            "roles_using_each_permission": {
                permission.code: role_usage.get(permission.id, [])
                for permission in permissions
            },
        }

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

    def _metadata_from_code(self, code: str) -> PermissionRegistryItem:
        parts = code.split(".")
        module = parts[0] if len(parts) >= 1 and parts[0] else "unknown"
        resource = parts[1] if len(parts) >= 2 and parts[1] else "unknown"
        action = parts[2] if len(parts) >= 3 and parts[2] else "manage"
        return PermissionRegistryItem(
            module=module,
            resource=resource,
            action=action,
            scope=self._default_scope_for_module(module),
        )

    def _default_scope_for_module(self, module: str) -> str:
        if module in {"settings", "guard"}:
            return "organization"
        if module == "flow":
            return "project"
        return "workspace"

    def _is_valid_permission_code(self, code: str) -> bool:
        parts = code.split(".")
        return len(parts) == 3 and all(part.strip() for part in parts)

    def _role_usage_by_permission_id(self) -> dict[int, list[str]]:
        rows = (
            self.db.query(RolePermission.permission_id, Role.name)
            .join(Role, Role.id == RolePermission.role_id)
            .all()
        )
        usage: dict[int, list[str]] = {}
        for permission_id, role_name in rows:
            usage.setdefault(permission_id, []).append(role_name)
        return usage

    def _duplicate_like_permissions(self, permissions: list[Permission]) -> list[list[str]]:
        groups: dict[tuple[str | None, str | None, str | None], list[str]] = {}
        for permission in permissions:
            key = (permission.module, permission.resource, permission.action)
            groups.setdefault(key, []).append(permission.code)
        return [codes for codes in groups.values() if len(codes) > 1]

    def _count_by(self, permissions: list[Permission], field: str) -> dict[str, int]:
        counts: dict[str, int] = {}
        for permission in permissions:
            value = str(getattr(permission, field, None) or "unknown")
            counts[value] = counts.get(value, 0) + 1
        return dict(sorted(counts.items()))

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
