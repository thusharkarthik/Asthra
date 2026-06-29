from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.access_control import CurrentUserPermissionsRead
from app.schemas.role import PermissionGapRead
from app.services.access_control_service import AccessControlService
from app.services.permission_service import PermissionService
from app.services.role_service import RoleService


router = APIRouter()


@router.get("/permission-inventory")
def get_permission_inventory(
    _: None = Depends(require_permission("settings.permission.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).inventory()


@router.get("/permission-gaps", response_model=list[PermissionGapRead])
def get_permission_gaps(
    _: None = Depends(require_permission("settings.permission.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).permission_gaps()


@router.get("/permission-registry/sync-preview")
def preview_permission_registry_sync(
    _: None = Depends(require_permission("settings.permission.manage")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).sync_registry_permissions(dry_run=True)


@router.post("/permission-registry/sync")
def sync_permission_registry(
    _: None = Depends(require_permission("settings.permission.manage")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    result = PermissionService(db).sync_registry_permissions(dry_run=False)
    # After syncing the permission catalog, seed new permissions onto roles that match
    # template patterns. sync_permissions=False avoids re-running the catalog sync above.
    RoleService(db).ensure_role_catalog(sync_permissions=False)
    return result


@router.get("/role-mapping-suggestions")
def get_role_mapping_suggestions(
    _: None = Depends(require_permission("settings.role.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).role_mapping_suggestions()


@router.get("/simulate", response_model=CurrentUserPermissionsRead)
def simulate_permissions(
    role_key: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not current_user.is_superuser:
        access_check = AccessControlService(db)
        platform_roles = access_check.get_effective_roles(current_user.id, "platform", None)
        if not any(r["key"] in {"platform_owner", "platform_admin"} for r in platform_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only superusers and platform owners/admins can simulate permissions.",
            )
    if not role_key and not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide role_key or user_id.",
        )
    access = AccessControlService(db)
    if role_key:
        role = db.query(Role).filter(Role.key == role_key, Role.is_active.is_(True)).first()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_key}' not found or is inactive.",
            )
        permission_codes = sorted(access._permission_codes_for_roles([role.id]))
        return {
            "permission_codes": permission_codes,
            "roles": [
                {
                    "id": role.id,
                    "name": role.name,
                    "key": role.key,
                    "scope": role.scope,
                    "source_scope_type": role.scope,
                    "source_scope_id": None,
                }
            ],
            "scope": {"scope_type": "platform", "scope_id": None},
        }
    return access.get_user_permissions(user_id, "platform", None)


@router.get("/debug/effective-access")
def get_debug_effective_access(
    user_id: int = Query(...),
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    action_keys: list[str] | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    access = AccessControlService(db)
    if not current_user.is_superuser and not access.can(current_user.id, "settings.permission.manage", scope_type, scope_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission required: settings.permission.manage")
    normalized_action_keys: list[str] = []
    for item in action_keys or []:
        normalized_action_keys.extend([part.strip() for part in item.split(",") if part.strip()])
    return access.debug_effective_access(user_id, scope_type, scope_id, normalized_action_keys)
