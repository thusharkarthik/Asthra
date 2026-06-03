from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.queue_repository import QueueRepository
from app.repositories.ticket_repository import TicketRepository
from app.schemas.ticket import TicketAIClassificationRead, TicketCreate, TicketUpdate
from app.services.ai_client import AIClient


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

    def ai_classify(self, ticket_id: int, request_id: str | None = None) -> TicketAIClassificationRead:
        ticket = self.get(ticket_id)
        # TODO: Future tiers can optionally auto-apply classification after human approval.
        prompt = (
            "Classify this support ticket. Respond as JSON with keys: category, priority_suggestion, "
            "severity_suggestion, routing_suggestion, possible_duplicate_hints, recommended_next_action.\n\n"
            f"Title: {ticket.title}\nDescription: {ticket.description}\n"
            f"Current priority: {ticket.priority}\nStatus: {ticket.status}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are a service desk triage specialist. Return concise JSON only.",
            request_id=request_id,
        )
        return TicketAIClassificationRead(
            ticket_id=ticket.id,
            category=result.get("category"),
            priority_suggestion=result.get("priority_suggestion"),
            severity_suggestion=result.get("severity_suggestion"),
            routing_suggestion=result.get("routing_suggestion"),
            possible_duplicate_hints=result.get("possible_duplicate_hints") or [],
            recommended_next_action=result.get("recommended_next_action"),
            raw_response=result.get("raw_response"),
        )
