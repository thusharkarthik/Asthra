from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page_tag import PageTag
from app.schemas.tag import PageTagAssign, PageTagCreate, PageTagRead
from app.services.tag_service import TagService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and page access checks.
    return None


@router.post("/tags", response_model=PageTagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_create: PageTagCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageTag:
    return TagService(db).create(tag_create)


@router.get("/tags", response_model=list[PageTagRead])
def list_tags(
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[PageTag]:
    return TagService(db).list()


@router.post(
    "/pages/{page_id}/tags",
    response_model=PageTagRead,
    status_code=status.HTTP_201_CREATED,
)
def add_tag_to_page(
    page_id: int,
    tag_assign: PageTagAssign,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageTag:
    return TagService(db).add_to_page(page_id, tag_assign)


@router.get("/pages/{page_id}/tags", response_model=list[PageTagRead])
def list_page_tags(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[PageTag]:
    return TagService(db).list_for_page(page_id)


@router.delete("/pages/{page_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_page(
    page_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    TagService(db).remove_from_page(page_id, tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
