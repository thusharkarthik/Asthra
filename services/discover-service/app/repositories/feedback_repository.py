from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate


class FeedbackRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: FeedbackCreate) -> Feedback:
        item = Feedback(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id: int | None = None, limit: int = 100, offset: int = 0) -> list[Feedback]:
        stmt = select(Feedback)
        if workspace_id is not None:
            stmt = stmt.where(Feedback.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(Feedback.id).limit(limit).offset(offset)).all())
