from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_ticket import ServiceTicket
from app.schemas.ticket import TicketCreate, TicketUpdate


class TicketRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: TicketCreate) -> ServiceTicket:
        item = ServiceTicket(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id=None, project_id=None, status=None, priority=None, queue_id=None, assignee_id=None, requester_id=None, limit=100, offset=0):
        stmt = select(ServiceTicket)
        for field, value in {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "status": status,
            "priority": priority,
            "queue_id": queue_id,
            "assignee_id": assignee_id,
            "requester_id": requester_id,
        }.items():
            if value is not None:
                stmt = stmt.where(getattr(ServiceTicket, field) == value)
        return list(self.db.scalars(stmt.order_by(ServiceTicket.id).limit(limit).offset(offset)).all())

    def get(self, item_id: int) -> ServiceTicket | None:
        return self.db.get(ServiceTicket, item_id)

    def update(self, item: ServiceTicket, data: TicketUpdate) -> ServiceTicket:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ServiceTicket) -> None:
        self.db.delete(item)
        self.db.commit()
