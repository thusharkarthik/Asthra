from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.navigation import (
    NavigationResponse,
    RoleNavigationConfigBatchUpdate,
    RoleNavigationConfigPreviewResponse,
    RoleNavigationConfigResponse,
)
from app.services.navigation_registry import NavigationRegistryService
from app.services.role_navigation_config import RoleNavigationConfigService


router = APIRouter()


@router.get("", response_model=NavigationResponse)
def get_resolved_navigation(
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return NavigationRegistryService(db).resolve_navigation_for_context(
        current_user,
        scope_type=scope_type,
        scope_id=scope_id,
    )


@router.get("/registry")
def get_navigation_registry(
    _: None = Depends(require_permission("settings.navigation.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    service = NavigationRegistryService(db)
    items = service.get_registry()
    return {
        "version": 1,
        "items": [service._item_to_payload(item) for item in items],
    }


@router.get("/role-config", response_model=RoleNavigationConfigResponse)
def get_role_navigation_config(
    role_id: int = Query(...),
    mode: str = Query(...),
    _: None = Depends(require_permission("settings.navigation.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return RoleNavigationConfigService(db).get_role_config(role_id, mode)


@router.put("/role-config", response_model=RoleNavigationConfigResponse)
def update_role_navigation_config(
    payload: RoleNavigationConfigBatchUpdate,
    _: None = Depends(require_permission("settings.navigation.manage")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return RoleNavigationConfigService(db).upsert_role_config(payload)


@router.get("/role-config/preview", response_model=RoleNavigationConfigPreviewResponse)
def get_role_navigation_config_preview(
    role_id: int = Query(...),
    mode: str = Query(...),
    _: None = Depends(require_permission("settings.navigation.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return RoleNavigationConfigService(db).get_preview(role_id, mode)
