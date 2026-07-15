from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.navigation import NavigationResponse
from app.services.navigation_registry import NavigationRegistryService


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
