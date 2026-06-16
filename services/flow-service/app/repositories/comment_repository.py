from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.models.work_item_comment import WorkItemComment
from app.schemas.comment import WorkItemCommentCreate


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_work_item(self, work_item_id: int) -> WorkItem | None:
        return self.db.get(WorkItem, work_item_id)

    def create(self, work_item_id: int, comment_create: WorkItemCommentCreate) -> WorkItemComment:
        comment = WorkItemComment(
            work_item_id=work_item_id,
            author_user_id=comment_create.author_user_id if comment_create.author_user_id is not None else 0,
            body=comment_create.body or "",
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemComment]:
        statement = (
            select(WorkItemComment)
            .where(
                WorkItemComment.work_item_id == work_item_id,
                WorkItemComment.is_active.is_(True),
            )
            .order_by(WorkItemComment.id)
        )
        return list(self.db.scalars(statement).all())
