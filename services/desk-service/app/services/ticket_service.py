from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.queue_repository import QueueRepository
from app.repositories.ticket_repository import TicketRepository
from app.schemas.ticket import TicketCreate, TicketUpdate


class TicketService:
    def __init__(self, db: Session) -> None:
        self.repository = TicketRepository(db)
        self.queue_repository = QueueRepository(db)

    def create(self, data: TicketCreate):
        if data.queue_id is not None and self.queue_repository.get(data.queue_id) is None:
            raise HTTPException(status_code=404, detail="Queue not found.")
        return self.repository.create(data)

    def list(self, **filters):
        return self.repository.list(**filters)

    def get(self, ticket_id: int):
        ticket = self.repository.get(ticket_id)
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")
        return ticket

    def update(self, ticket_id: int, data: TicketUpdate):
        if data.queue_id is not None and self.queue_repository.get(data.queue_id) is None:
            raise HTTPException(status_code=404, detail="Queue not found.")
        return self.repository.update(self.get(ticket_id), data)

    def delete(self, ticket_id: int) -> None:
        self.repository.delete(self.get(ticket_id))

    # TODO: Add AI ticket classification, routing, duplicate detection, and resolution suggestions later.
