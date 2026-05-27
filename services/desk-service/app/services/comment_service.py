from sqlalchemy.orm import Session

from app.repositories.comment_repository import CommentRepository
from app.schemas.comment import TicketCommentCreate
from app.services.ticket_service import TicketService


class CommentService:
    def __init__(self, db: Session) -> None:
        self.repository = CommentRepository(db)
        self.ticket_service = TicketService(db)

    def create(self, ticket_id: int, data: TicketCommentCreate):
        self.ticket_service.get(ticket_id)
        return self.repository.create(ticket_id, data)

    def list_by_ticket(self, ticket_id: int):
        self.ticket_service.get(ticket_id)
        return self.repository.list_by_ticket(ticket_id)
