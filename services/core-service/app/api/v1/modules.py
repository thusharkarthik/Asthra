from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.module_registry import AvailableModulesResponse, ModuleCatalogResponse
from app.services.module_registry import ModuleRegistryService


router = APIRouter()


@router.get("", response_model=ModuleCatalogResponse)
def list_module_catalog(
    _: None = Depends(require_permission("settings.access_control.view")),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return {"modules": ModuleRegistryService(db).get_module_catalog()}


@router.get("/available", response_model=AvailableModulesResponse)
def list_available_modules(
    navigation_mode: str = Query(default="platform"),
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    service = ModuleRegistryService(db)
    return {
        "navigation_mode": navigation_mode,
        "modules": service.resolve_modules_for_context(
            current_user,
            scope_type=scope_type,
            scope_id=scope_id,
            navigation_mode=navigation_mode,
        ),
    }
