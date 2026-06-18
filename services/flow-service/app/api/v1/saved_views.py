from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.saved_view import SavedView
from app.schemas.saved_view import SavedViewCreate, SavedViewRead, SavedViewUpdate
from app.services.saved_view_service import SavedViewService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=SavedViewRead, status_code=status.HTTP_201_CREATED)
def create_saved_view(
    saved_view_create: SavedViewCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> SavedView:
    return SavedViewService(db).create(saved_view_create)


@router.get("", response_model=list[SavedViewRead])
def list_saved_views(
    workspace_id: int | None = None,
    project_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[SavedView]:
    return SavedViewService(db).list(workspace_id=workspace_id, project_id=project_id, limit=limit, offset=offset)


@router.patch("/{saved_view_id}", response_model=SavedViewRead)
def update_saved_view(
    saved_view_id: int,
    saved_view_update: SavedViewUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> SavedView:
    return SavedViewService(db).update(saved_view_id, saved_view_update)


@router.delete("/{saved_view_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_view(
    saved_view_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    SavedViewService(db).delete(saved_view_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
