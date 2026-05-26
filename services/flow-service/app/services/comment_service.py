from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item_comment import WorkItemComment
from app.repositories.comment_repository import CommentRepository
from app.schemas.comment import WorkItemCommentCreate


class CommentService:
    def __init__(self, db: Session) -> None:
        self.comment_repository = CommentRepository(db)

    def create(self, work_item_id: int, comment_create: WorkItemCommentCreate) -> WorkItemComment:
        self._ensure_work_item(work_item_id)
        return self.comment_repository.create(work_item_id, comment_create)

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemComment]:
        self._ensure_work_item(work_item_id)
        return self.comment_repository.list_for_work_item(work_item_id)

    def _ensure_work_item(self, work_item_id: int) -> None:
        work_item = self.comment_repository.get_work_item(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
