from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

INTEGRATION_STATUSES = {"active", "inactive", "error"}
DELIVERY_STATUSES = {"pending", "success", "failed"}
SYNC_STATUSES = {"pending", "running", "success", "failed"}
CONNECTION_STATUSES = {"connected", "disconnected", "error"}


def _validate(value: str, allowed: set[str], label: str) -> str:
    if value not in allowed:
        raise ValueError(f"{label} must be one of: {', '.join(sorted(allowed))}")
    return value


class IntegrationCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    status: str = "inactive"
    configuration: dict[str, Any] | None = None
    created_by_id: int | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _validate(value, INTEGRATION_STATUSES, "integration status")


class IntegrationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    provider: str | None = Field(default=None, min_length=1)
    status: str | None = None
    configuration: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _validate(value, INTEGRATION_STATUSES, "integration status") if value is not None else value


class IntegrationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    name: str
    provider: str
    status: str
    configuration: dict[str, Any] | None
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime


class ConnectorCreate(BaseModel):
    integration_id: int
    connector_type: str = Field(min_length=1)
    connector_name: str = Field(min_length=1)
    status: str = "inactive"
    config: dict[str, Any] | None = None


class ConnectorUpdate(BaseModel):
    connector_type: str | None = Field(default=None, min_length=1)
    connector_name: str | None = Field(default=None, min_length=1)
    status: str | None = None
    config: dict[str, Any] | None = None


class ConnectorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    integration_id: int
    connector_type: str
    connector_name: str
    status: str
    config: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class WebhookEndpointCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    target_url: str = Field(min_length=1)
    secret: str | None = None
    is_active: bool = True


class WebhookEndpointUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    target_url: str | None = Field(default=None, min_length=1)
    secret: str | None = None
    is_active: bool | None = None


class WebhookEndpointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    name: str
    target_url: str
    secret: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WebhookDeliveryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    webhook_endpoint_id: int
    event_type: str
    payload: dict[str, Any] | None
    delivery_status: str
    response_status: int | None
    delivered_at: datetime | None
    created_at: datetime


class EventSubscriptionCreate(BaseModel):
    workspace_id: int
    event_name: str = Field(min_length=1)
    subscriber_type: str = Field(min_length=1)
    subscriber_reference: str | None = None
    is_active: bool = True


class EventSubscriptionUpdate(BaseModel):
    event_name: str | None = Field(default=None, min_length=1)
    subscriber_type: str | None = Field(default=None, min_length=1)
    subscriber_reference: str | None = None
    is_active: bool | None = None


class EventSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    event_name: str
    subscriber_type: str
    subscriber_reference: str | None
    is_active: bool
    created_at: datetime


class SyncJobCreate(BaseModel):
    integration_id: int
    job_type: str = Field(min_length=1)
    status: str = "pending"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    execution_log: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _validate(value, SYNC_STATUSES, "sync job status")


class SyncJobUpdate(BaseModel):
    job_type: str | None = Field(default=None, min_length=1)
    status: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    execution_log: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _validate(value, SYNC_STATUSES, "sync job status") if value is not None else value


class SyncJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    integration_id: int
    job_type: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    execution_log: str | None
    created_at: datetime


class APIConnectionCreate(BaseModel):
    workspace_id: int
    provider: str = Field(min_length=1)
    base_url: str | None = None
    auth_type: str = Field(min_length=1)
    connection_status: str = "disconnected"

    @field_validator("connection_status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _validate(value, CONNECTION_STATUSES, "connection status")


class APIConnectionUpdate(BaseModel):
    provider: str | None = Field(default=None, min_length=1)
    base_url: str | None = None
    auth_type: str | None = Field(default=None, min_length=1)
    connection_status: str | None = None

    @field_validator("connection_status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _validate(value, CONNECTION_STATUSES, "connection status") if value is not None else value


class APIConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    provider: str
    base_url: str | None
    auth_type: str
    connection_status: str
    created_at: datetime
    updated_at: datetime
