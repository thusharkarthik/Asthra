from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item_comment import WorkItemComment
from app.schemas.comment import WorkItemCommentCreate, WorkItemCommentRead, WorkItemCommentUpdate
from app.services.comment_service import CommentService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post(
    "/work-items/{work_item_id}/comments",
    response_model=WorkItemCommentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_work_item_comment(
    work_item_id: int,
    comment_create: WorkItemCommentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemComment:
    return CommentService(db).create(work_item_id, comment_create)


@router.get("/work-items/{work_item_id}/comments", response_model=list[WorkItemCommentRead])
def list_work_item_comments(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItemComment]:
    return CommentService(db).list_for_work_item(work_item_id)


@router.patch("/work-items/{work_item_id}/comments/{comment_id}", response_model=WorkItemCommentRead)
def update_work_item_comment(
    work_item_id: int,
    comment_id: int,
    comment_update: WorkItemCommentUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemComment:
    return CommentService(db).update(work_item_id, comment_id, comment_update)


@router.delete("/work-items/{work_item_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item_comment(
    work_item_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    CommentService(db).delete(work_item_id, comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
