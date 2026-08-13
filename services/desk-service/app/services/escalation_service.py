from sqlalchemy.orm import Session

from app.repositories.escalation_repository import EscalationRepository
from app.schemas.escalation import EscalationCreate
from app.services.ticket_service import TicketService


class EscalationService:
    def __init__(self, db: Session) -> None:
        self.repository = EscalationRepository(db)
        self.ticket_service = TicketService(db)

    def create(self, ticket_id: int, data: EscalationCreate):
        self.ticket_service.get(ticket_id)
        return self.repository.create(ticket_id, data)

    def list_by_ticket(self, ticket_id: int):
        self.ticket_service.get(ticket_id)
        return self.repository.list_by_ticket(ticket_id)
