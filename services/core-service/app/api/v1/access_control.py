from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import PermissionGapRead
from app.services.permission_service import PermissionService


router = APIRouter()


@router.get("/permission-inventory")
def get_permission_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).inventory()


@router.get("/permission-gaps", response_model=list[PermissionGapRead])
def get_permission_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).permission_gaps()


@router.get("/permission-registry/sync-preview")
def preview_permission_registry_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).sync_registry_permissions(dry_run=True)


@router.post("/permission-registry/sync")
def sync_permission_registry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).sync_registry_permissions(dry_run=False)


@router.get("/role-mapping-suggestions")
def get_role_mapping_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).role_mapping_suggestions()
