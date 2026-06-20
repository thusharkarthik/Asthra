from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.base import FullTimestampedRead


class IncidentCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    alert_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    severity: str = "sev3"
    status: str = "open"
    impacted_service: str | None = None
    commander_id: int | None = None
    incident_commander_id: int | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    created_by: int | None = None


class IncidentUpdate(BaseModel):
    alert_id: int | None = None
    project_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    impacted_service: str | None = None
    commander_id: int | None = None
    incident_commander_id: int | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    created_by: int | None = None


class IncidentRead(FullTimestampedRead):
    workspace_id: int
    project_id: int | None = None
    alert_id: int | None = None
    title: str
    description: str | None = None
    severity: str
    status: str
    impacted_service: str | None = None
    commander_id: int | None = None
    incident_commander_id: int | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    created_by: int | None = None


class IncidentAISummaryRead(BaseModel):
    incident_id: int
    current_situation: str | None = None
    impact: str | None = None
    likely_cause: str | None = None
    timeline_summary: str | None = None
    next_actions: list[str] = []
    customer_facing_update_draft: str | None = None
    raw_response: str | None = None


class IncidentMemoryDocumentPayload(BaseModel):
    source_type: str = "incident"
    external_reference: str
    workspace_id: int
    title: str
    content: str
    metadata: dict
