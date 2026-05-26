from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page_comment import PageComment
from app.schemas.comment import PageCommentCreate, PageCommentRead, PageCommentUpdate
from app.services.comment_service import CommentService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and page access checks.
    return None


@router.post(
    "/pages/{page_id}/comments",
    response_model=PageCommentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_page_comment(
    page_id: int,
    comment_create: PageCommentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageComment:
    return CommentService(db).create(page_id, comment_create)


@router.get("/pages/{page_id}/comments", response_model=list[PageCommentRead])
def list_page_comments(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[PageComment]:
    return CommentService(db).list_for_page(page_id)


@router.patch("/comments/{comment_id}", response_model=PageCommentRead)
def update_comment(
    comment_id: int,
    comment_update: PageCommentUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageComment:
    return CommentService(db).update(comment_id, comment_update)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    CommentService(db).delete(comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
