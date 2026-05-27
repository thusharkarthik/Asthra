from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.services.ticket_service import TicketService

VALID_SEVERITIES = {"low", "medium", "high", "critical"}


class IncidentService:
    def __init__(self, db: Session) -> None:
        self.repository = IncidentRepository(db)
        self.ticket_service = TicketService(db)

    def create(self, data: IncidentCreate):
        self._validate_severity(data.severity)
        if data.ticket_id is not None:
            self.ticket_service.get(data.ticket_id)
        return self.repository.create(data)

    def list(self, **filters):
        return self.repository.list(**filters)

    def get(self, incident_id: int):
        item = self.repository.get(incident_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
        return item

    def update(self, incident_id: int, data: IncidentUpdate):
        if data.severity is not None:
            self._validate_severity(data.severity)
        if data.ticket_id is not None:
            self.ticket_service.get(data.ticket_id)
        return self.repository.update(self.get(incident_id), data)

    def _validate_severity(self, value: str) -> None:
        if value not in VALID_SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid incident severity.")

    # TODO: Add AI incident summary later.
