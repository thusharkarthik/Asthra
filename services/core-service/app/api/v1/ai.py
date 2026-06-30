from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ai_context import AIContextRegistryResponse, AIContextResponse
from app.services.ai_context_registry import AIContextRegistryService


router = APIRouter()


def _parse_categories(categories: str | None) -> list[str] | None:
    if not categories:
        return None
    parsed = [category.strip() for category in categories.split(",") if category.strip()]
    return parsed or None


@router.get("/context", response_model=AIContextResponse)
def get_ai_context(
    organization_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    categories: str | None = Query(default=None, description="Comma-separated context categories."),
    include_data: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return AIContextRegistryService(db).resolve_ai_context_for_user(
        current_user,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
        categories=_parse_categories(categories),
        include_data=include_data,
    )


@router.get("/context/registry", response_model=AIContextRegistryResponse)
def get_ai_context_registry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    service = AIContextRegistryService(db)
    return {
        "generated_at": datetime.now(timezone.utc),
        "context_blocks": service.get_ai_context_registry(),
    }
