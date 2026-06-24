from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import PermissionGapRead
from app.services.access_control_service import AccessControlService
from app.services.permission_service import PermissionService


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
    return PermissionService(db).sync_registry_permissions(dry_run=False)


@router.get("/role-mapping-suggestions")
def get_role_mapping_suggestions(
    _: None = Depends(require_permission("settings.role.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).role_mapping_suggestions()


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
