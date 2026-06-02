from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator

from shared_events.naming import validate_event_name


class EventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_name: str
    source_service: str
    workspace_id: int | None = None
    organization_id: int | None = None
    actor_user_id: int | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str | None = None
    request_id: str | None = None

    @field_validator("event_name")
    @classmethod
    def event_name_uses_dot_notation(cls, value: str) -> str:
        return validate_event_name(value)


def build_event_envelope(
    event_name: str,
    source_service: str,
    payload: dict[str, Any] | None = None,
    **kwargs: Any,
) -> EventEnvelope:
    return EventEnvelope(
        event_name=event_name,
        source_service=source_service,
        payload=payload or {},
        **kwargs,
    )
