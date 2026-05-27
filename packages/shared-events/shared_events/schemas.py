from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator

from shared_events.validation import validate_event_name


class BaseEvent(BaseModel):
    event_name: str
    source_service: str
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_name")
    @classmethod
    def event_name_uses_dot_notation(cls, value: str) -> str:
        return validate_event_name(value)


class EventEnvelope(BaseEvent):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    workspace_id: int | None = None
    organization_id: int | None = None
    actor_user_id: int | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str | None = None
    request_id: str | None = None
