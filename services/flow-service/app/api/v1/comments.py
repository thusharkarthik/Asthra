from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item_comment import WorkItemComment
from app.schemas.comment import WorkItemCommentCreate, WorkItemCommentRead
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
