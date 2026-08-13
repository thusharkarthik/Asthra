from typing import Any

from pydantic import BaseModel, Field, field_validator

from shared_events.envelope import EventEnvelope
from shared_events.naming import validate_event_name


class BaseEvent(BaseModel):
    event_name: str
    source_service: str
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_name")
    @classmethod
    def event_name_uses_dot_notation(cls, value: str) -> str:
        return validate_event_name(value)


__all__ = ["BaseEvent", "EventEnvelope"]
