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
from app.schemas.incident import IncidentAISummaryRead, IncidentMemoryDocumentPayload
from app.services.ai_client import AIClient

SEVERITIES = {"low", "medium", "high", "critical", "sev1", "sev2", "sev3", "sev4"}
ALERT_STATUSES = {"open", "acknowledged", "resolved"}
INCIDENT_STATUSES = {"open", "investigating", "identified", "mitigating", "monitoring", "resolved", "closed"}


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

    def ai_summary(self, item_id: int, request_id: str | None = None) -> IncidentAISummaryRead:
        incident = self.get(item_id)
        timeline = TimelineRepository(self.repo.db).list_by_incident(incident.id)
        timeline_text = "\n".join(f"- {event.event_type}: {event.content}" for event in timeline) or "No timeline events yet."
        # TODO: Future tiers can use this to draft outage updates/postmortems after human approval.
        prompt = (
            "Summarize this incident. Respond as JSON with keys: current_situation, impact, likely_cause, "
            "timeline_summary, next_actions, customer_facing_update_draft.\n\n"
            f"Title: {incident.title}\nDescription: {incident.description or 'No description'}\n"
            f"Severity: {incident.severity}\nStatus: {incident.status}\nTimeline:\n{timeline_text}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are an incident commander. Return concise JSON only.",
            request_id=request_id,
        )
        return IncidentAISummaryRead(
            incident_id=incident.id,
            current_situation=result.get("current_situation"),
            impact=result.get("impact"),
            likely_cause=result.get("likely_cause"),
            timeline_summary=result.get("timeline_summary"),
            next_actions=result.get("next_actions") or [],
            customer_facing_update_draft=result.get("customer_facing_update_draft"),
            raw_response=result.get("raw_response"),
        )

    def prepare_memory_document(self, item_id: int) -> IncidentMemoryDocumentPayload:
        incident = self.get(item_id)
        timeline = TimelineRepository(self.repo.db).list_by_incident(incident.id)
        timeline_text = "\n".join(f"{event.event_type}: {event.content}" for event in timeline)
        return IncidentMemoryDocumentPayload(
            external_reference=f"incident:{incident.id}",
            workspace_id=incident.workspace_id,
            title=incident.title,
            content="\n\n".join(part for part in [incident.description, timeline_text] if part),
            metadata={
                "incident_id": incident.id,
                "alert_id": incident.alert_id,
                "severity": incident.severity,
                "status": incident.status,
                "commander_id": incident.commander_id,
            },
        )


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
