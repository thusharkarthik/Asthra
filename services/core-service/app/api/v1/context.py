from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.context_version import ContextVersionRead
from app.services.context_version_service import ContextVersionService

router = APIRouter()


@router.get("/version", response_model=ContextVersionRead)
def get_context_version(
    organization_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return ContextVersionService(db).get_version(
        current_user,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
    )
