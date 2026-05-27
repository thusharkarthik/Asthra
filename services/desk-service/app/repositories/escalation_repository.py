from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.escalation import Escalation
from app.schemas.escalation import EscalationCreate


class EscalationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, ticket_id: int, data: EscalationCreate) -> Escalation:
        item = Escalation(ticket_id=ticket_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_ticket(self, ticket_id: int) -> list[Escalation]:
        return list(self.db.scalars(select(Escalation).where(Escalation.ticket_id == ticket_id).order_by(Escalation.id)).all())
