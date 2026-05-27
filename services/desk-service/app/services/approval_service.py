from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.approval_repository import ApprovalRepository
from app.schemas.approval import ApprovalCreate, ApprovalUpdate
from app.services.ticket_service import TicketService

VALID_APPROVAL_STATUSES = {"pending", "approved", "rejected"}


class ApprovalService:
    def __init__(self, db: Session) -> None:
        self.repository = ApprovalRepository(db)
        self.ticket_service = TicketService(db)

    def create(self, ticket_id: int, data: ApprovalCreate):
        self.ticket_service.get(ticket_id)
        self._validate_status(data.status)
        return self.repository.create(ticket_id, data)

    def list_by_ticket(self, ticket_id: int):
        self.ticket_service.get(ticket_id)
        return self.repository.list_by_ticket(ticket_id)

    def update(self, approval_id: int, data: ApprovalUpdate):
        item = self.repository.get(approval_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")
        if data.status is not None:
            self._validate_status(data.status)
        return self.repository.update(item, data)

    def _validate_status(self, value: str) -> None:
        if value not in VALID_APPROVAL_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid approval status.")
