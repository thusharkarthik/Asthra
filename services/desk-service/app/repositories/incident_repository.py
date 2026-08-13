from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate


class IncidentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: IncidentCreate) -> Incident:
        item = Incident(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id=None, status=None, severity=None, limit=100, offset=0):
        stmt = select(Incident)
        if workspace_id is not None:
            stmt = stmt.where(Incident.workspace_id == workspace_id)
        if status is not None:
            stmt = stmt.where(Incident.status == status)
        if severity is not None:
            stmt = stmt.where(Incident.severity == severity)
        return list(self.db.scalars(stmt.order_by(Incident.id).limit(limit).offset(offset)).all())

    def get(self, item_id: int) -> Incident | None:
        return self.db.get(Incident, item_id)

    def update(self, item: Incident, data: IncidentUpdate) -> Incident:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
