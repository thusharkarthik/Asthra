from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.search import SearchRegistryRead, SearchResponseRead
from app.services.global_search_registry import GlobalSearchRegistryService


router = APIRouter()


@router.get("", response_model=SearchResponseRead)
def search(
    q: str = Query(default="", max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
    category: list[str] | None = Query(default=None),
    entity_type: list[str] | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return GlobalSearchRegistryService(db).search_global(
        current_user,
        query=q,
        limit=limit,
        categories=category,
        entity_types=entity_type,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
    )


@router.get("/registry", response_model=SearchRegistryRead)
def get_search_registry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return {"entities": GlobalSearchRegistryService(db).get_search_registry()}
