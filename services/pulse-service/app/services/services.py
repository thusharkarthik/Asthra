from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.repositories import (
    AlertRepository,
    ComponentRepository,
    EscalationPolicyRepository,
    IncidentRepository,
    OnCallScheduleRepository,
    PostmortemRepository,
    StatusPageRepository,
    TimelineRepository,
)

SEVERITIES = {"low", "medium", "high", "critical"}
ALERT_STATUSES = {"open", "acknowledged", "resolved"}
INCIDENT_STATUSES = {"investigating", "identified", "monitoring", "resolved"}


def _not_found(name: str):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found.")


class AlertService:
    def __init__(self, db: Session) -> None:
        self.repo = AlertRepository(db)

    def create(self, data):
        self._validate(data.severity, data.status)
        return self.repo.create(data)

    def list(self, **filters):
        return self.repo.list(**filters)

    def get(self, item_id: int):
        item = self.repo.get(item_id)
        if item is None:
            _not_found("Alert")
        return item

    def update(self, item_id: int, data):
        if data.severity is not None and data.severity not in SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid severity.")
        if data.status is not None and data.status not in ALERT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid alert status.")
        return self.repo.update(self.get(item_id), data)

    def _validate(self, severity: str, status_value: str) -> None:
        if severity not in SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid severity.")
        if status_value not in ALERT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid alert status.")


class IncidentService:
    def __init__(self, db: Session) -> None:
        self.repo = IncidentRepository(db)
        self.alerts = AlertRepository(db)

    def create(self, data):
        self._validate(data.severity, data.status)
        if data.alert_id is not None and self.alerts.get(data.alert_id) is None:
            _not_found("Alert")
        return self.repo.create(data)

    def list(self, **filters):
        return self.repo.list(**filters)

    def get(self, item_id: int):
        item = self.repo.get(item_id)
        if item is None:
            _not_found("Incident")
        return item

    def update(self, item_id: int, data):
        if data.severity is not None and data.severity not in SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid severity.")
        if data.status is not None and data.status not in INCIDENT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid incident status.")
        if data.alert_id is not None and self.alerts.get(data.alert_id) is None:
            _not_found("Alert")
        return self.repo.update(self.get(item_id), data)

    def _validate(self, severity: str, status_value: str) -> None:
        if severity not in SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid severity.")
        if status_value not in INCIDENT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid incident status.")

    # TODO: Add AI root cause analysis, incident summary, outage update drafting, and anomaly pattern detection later.


class TimelineService:
    def __init__(self, db: Session) -> None:
        self.repo = TimelineRepository(db)
        self.incidents = IncidentService(db)

    def create(self, incident_id: int, data):
        self.incidents.get(incident_id)
        return self.repo.create(incident_id, data)

    def list_by_incident(self, incident_id: int):
        self.incidents.get(incident_id)
        return self.repo.list_by_incident(incident_id)


class OnCallScheduleService:
    def __init__(self, db: Session) -> None:
        self.repo = OnCallScheduleRepository(db)
    def create(self, data): return self.repo.create(data)
    def list(self, workspace_id=None): return self.repo.list(workspace_id)
    def get(self, item_id: int):
        item = self.repo.get(item_id)
        if item is None: _not_found("On-call schedule")
        return item


class EscalationPolicyService:
    def __init__(self, db: Session) -> None:
        self.repo = EscalationPolicyRepository(db)
    def create(self, data): return self.repo.create(data)
    def list(self, workspace_id=None): return self.repo.list(workspace_id)


class StatusPageService:
    def __init__(self, db: Session) -> None:
        self.repo = StatusPageRepository(db)
    def create(self, data): return self.repo.create(data)
    def list(self, **filters): return self.repo.list(**filters)
    def get(self, item_id: int):
        item = self.repo.get(item_id)
        if item is None: _not_found("Status page")
        return item


class ComponentService:
    def __init__(self, db: Session) -> None:
        self.repo = ComponentRepository(db)
        self.pages = StatusPageService(db)
    def create(self, page_id: int, data):
        self.pages.get(page_id)
        return self.repo.create_for_page(page_id, data)
    def list_by_page(self, page_id: int):
        self.pages.get(page_id)
        return self.repo.list_by_page(page_id)
    def update(self, component_id: int, data):
        item = self.repo.get(component_id)
        if item is None: _not_found("Component")
        return self.repo.update(item, data)


class PostmortemService:
    def __init__(self, db: Session) -> None:
        self.repo = PostmortemRepository(db)
        self.incidents = IncidentService(db)
    def create(self, incident_id: int, data):
        self.incidents.get(incident_id)
        if self.repo.get_by_incident(incident_id) is not None:
            raise HTTPException(status_code=400, detail="Postmortem already exists for this incident.")
        return self.repo.create_for_incident(incident_id, data)
    def get_by_incident(self, incident_id: int):
        self.incidents.get(incident_id)
        item = self.repo.get_by_incident(incident_id)
        if item is None: _not_found("Postmortem")
        return item
    def update(self, postmortem_id: int, data):
        item = self.repo.get(postmortem_id)
        if item is None: _not_found("Postmortem")
        return self.repo.update(item, data)
