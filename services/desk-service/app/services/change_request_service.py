from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.change_request_repository import ChangeRequestRepository
from app.schemas.change_request import ChangeRequestCreate, ChangeRequestUpdate
from app.services.ticket_service import TicketService


class ChangeRequestService:
    def __init__(self, db: Session) -> None:
        self.repository = ChangeRequestRepository(db)
        self.ticket_service = TicketService(db)

    def create(self, data: ChangeRequestCreate):
        if data.ticket_id is not None:
            self.ticket_service.get(data.ticket_id)
        return self.repository.create(data)

    def list(self, workspace_id: int | None = None):
        return self.repository.list(workspace_id)

    def get(self, item_id: int):
        item = self.repository.get(item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found.")
        return item

    def update(self, item_id: int, data: ChangeRequestUpdate):
        if data.ticket_id is not None:
            self.ticket_service.get(data.ticket_id)
        return self.repository.update(self.get(item_id), data)
