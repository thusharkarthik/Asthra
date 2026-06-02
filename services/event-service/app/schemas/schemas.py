from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_event_name(value: str) -> str:
    parts = value.split(".")
    if len(parts) < 3 or any(not part for part in parts):
        raise ValueError("Event names must use dot notation like core.organization.created.")
    return value


class EventRecordCreate(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_name: str
    source_service: str
    workspace_id: int | None = None
    organization_id: int | None = None
    actor_user_id: int | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    payload: dict[str, Any] | None = Field(default_factory=dict)
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str | None = None
    request_id: str | None = None

    @field_validator("event_name")
    @classmethod
    def event_name_uses_dot_notation(cls, value: str) -> str:
        return validate_event_name(value)


class EventRecordRead(EventRecordCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventFilter(BaseModel):
    event_name: str | None = None
    source_service: str | None = None
    workspace_id: int | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    limit: int = 100
    offset: int = 0


class EventSubscriptionCreate(BaseModel):
    workspace_id: int | None = None
    subscriber_name: str
    event_pattern: str
    target_type: str
    target_reference: str | None = None
    is_active: bool = True

    @field_validator("event_pattern")
    @classmethod
    def event_pattern_required(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("event_pattern is required.")
        return value


class EventSubscriptionUpdate(BaseModel):
    subscriber_name: str | None = None
    event_pattern: str | None = None
    target_type: str | None = None
    target_reference: str | None = None
    is_active: bool | None = None


class EventSubscriptionRead(EventSubscriptionCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventDeliveryLogRead(BaseModel):
    id: int
    event_record_id: int
    subscription_id: int | None = None
    delivery_status: str
    error_message: str | None = None
    delivered_at: datetime | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
