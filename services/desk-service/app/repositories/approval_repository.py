from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.schemas.approval import ApprovalCreate, ApprovalUpdate


class ApprovalRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, ticket_id: int, data: ApprovalCreate) -> Approval:
        item = Approval(ticket_id=ticket_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_ticket(self, ticket_id: int) -> list[Approval]:
        return list(self.db.scalars(select(Approval).where(Approval.ticket_id == ticket_id).order_by(Approval.id)).all())

    def get(self, item_id: int) -> Approval | None:
        return self.db.get(Approval, item_id)

    def update(self, item: Approval, data: ApprovalUpdate) -> Approval:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
