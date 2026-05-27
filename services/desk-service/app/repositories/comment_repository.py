from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ticket_comment import TicketComment
from app.schemas.comment import TicketCommentCreate


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, ticket_id: int, data: TicketCommentCreate) -> TicketComment:
        item = TicketComment(ticket_id=ticket_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_ticket(self, ticket_id: int) -> list[TicketComment]:
        return list(self.db.scalars(select(TicketComment).where(TicketComment.ticket_id == ticket_id).order_by(TicketComment.id)).all())
