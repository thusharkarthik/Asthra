from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page import Page
from app.models.space import Space
from app.schemas.page import PageRead
from app.schemas.space import SpaceCreate, SpaceRead, SpaceUpdate
from app.services.page_service import PageService
from app.services.space_service import SpaceService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and workspace membership checks.
    return None


@router.post("", response_model=SpaceRead, status_code=status.HTTP_201_CREATED)
def create_space(
    space_create: SpaceCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Space:
    return SpaceService(db).create(space_create)


@router.get("", response_model=list[SpaceRead])
def list_spaces(
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[Space]:
    return SpaceService(db).list(workspace_id=workspace_id)


@router.get("/{space_id}", response_model=SpaceRead)
def get_space(
    space_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Space:
    return SpaceService(db).get(space_id)


@router.patch("/{space_id}", response_model=SpaceRead)
def update_space(
    space_id: int,
    space_update: SpaceUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Space:
    return SpaceService(db).update(space_id, space_update)


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(
    space_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    SpaceService(db).delete(space_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{space_id}/pages", response_model=list[PageRead])
def list_space_pages(
    space_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[Page]:
    return PageService(db).list_for_space(space_id)
