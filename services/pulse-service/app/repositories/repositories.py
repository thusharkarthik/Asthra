from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.escalation_policy import EscalationPolicy
from app.models.incident import Incident
from app.models.incident_timeline_event import IncidentTimelineEvent
from app.models.on_call_schedule import OnCallSchedule
from app.models.postmortem import Postmortem
from app.models.status_page import StatusPage
from app.models.status_page_component import StatusPageComponent


class CRUDRepository:
    model = None

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data):
        item = self.model(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data):
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item


class AlertRepository(CRUDRepository):
    model = Alert

    def list(self, *, workspace_id=None, status=None, severity=None, source=None, limit=100, offset=0):
        stmt = select(Alert)
        if workspace_id is not None:
            stmt = stmt.where(Alert.workspace_id == workspace_id)
        if status is not None:
            stmt = stmt.where(Alert.status == status)
        if severity is not None:
            stmt = stmt.where(Alert.severity == severity)
        if source is not None:
            stmt = stmt.where(Alert.source == source)
        return list(self.db.scalars(stmt.order_by(Alert.id).limit(limit).offset(offset)).all())


class IncidentRepository(CRUDRepository):
    model = Incident

    def list(self, *, workspace_id=None, status=None, severity=None, limit=100, offset=0):
        stmt = select(Incident)
        if workspace_id is not None:
            stmt = stmt.where(Incident.workspace_id == workspace_id)
        if status is not None:
            stmt = stmt.where(Incident.status == status)
        if severity is not None:
            stmt = stmt.where(Incident.severity == severity)
        return list(self.db.scalars(stmt.order_by(Incident.id).limit(limit).offset(offset)).all())


class TimelineRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, incident_id: int, data):
        item = IncidentTimelineEvent(incident_id=incident_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_incident(self, incident_id: int):
        return list(self.db.scalars(select(IncidentTimelineEvent).where(IncidentTimelineEvent.incident_id == incident_id).order_by(IncidentTimelineEvent.id)).all())


class OnCallScheduleRepository(CRUDRepository):
    model = OnCallSchedule

    def list(self, workspace_id=None):
        stmt = select(OnCallSchedule)
        if workspace_id is not None:
            stmt = stmt.where(OnCallSchedule.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(OnCallSchedule.id)).all())


class EscalationPolicyRepository(CRUDRepository):
    model = EscalationPolicy

    def list(self, workspace_id=None):
        stmt = select(EscalationPolicy)
        if workspace_id is not None:
            stmt = stmt.where(EscalationPolicy.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(EscalationPolicy.id)).all())


class StatusPageRepository(CRUDRepository):
    model = StatusPage

    def list(self, *, workspace_id=None, is_public=None, limit=100, offset=0):
        stmt = select(StatusPage)
        if workspace_id is not None:
            stmt = stmt.where(StatusPage.workspace_id == workspace_id)
        if is_public is not None:
            stmt = stmt.where(StatusPage.is_public == is_public)
        return list(self.db.scalars(stmt.order_by(StatusPage.id).limit(limit).offset(offset)).all())


class ComponentRepository(CRUDRepository):
    model = StatusPageComponent

    def create_for_page(self, status_page_id: int, data):
        item = StatusPageComponent(status_page_id=status_page_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_page(self, status_page_id: int):
        return list(self.db.scalars(select(StatusPageComponent).where(StatusPageComponent.status_page_id == status_page_id).order_by(StatusPageComponent.id)).all())


class PostmortemRepository(CRUDRepository):
    model = Postmortem

    def create_for_incident(self, incident_id: int, data):
        item = Postmortem(incident_id=incident_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_by_incident(self, incident_id: int):
        return self.db.scalars(select(Postmortem).where(Postmortem.incident_id == incident_id)).first()
