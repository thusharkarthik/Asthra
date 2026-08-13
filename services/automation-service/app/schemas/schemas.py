from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

WORKFLOW_STATUSES = {"draft", "active", "paused", "archived"}
EXECUTION_STATUSES = {"pending", "running", "success", "failed"}


class WorkflowCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    description: str | None = None
    status: str = "draft"
    created_by_id: int

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in WORKFLOW_STATUSES:
            raise ValueError("status must be draft, active, paused, or archived")
        return value


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None and value not in WORKFLOW_STATUSES:
            raise ValueError("status must be draft, active, paused, or archived")
        return value


class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    name: str
    description: str | None
    status: str
    created_by_id: int
    created_at: datetime
    updated_at: datetime


class TriggerCreate(BaseModel):
    trigger_type: str = Field(min_length=1)
    trigger_config: dict[str, Any] | None = None
    is_active: bool = True


class TriggerUpdate(BaseModel):
    trigger_type: str | None = Field(default=None, min_length=1)
    trigger_config: dict[str, Any] | None = None
    is_active: bool | None = None


class TriggerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    trigger_type: str
    trigger_config: dict[str, Any] | None
    is_active: bool
    created_at: datetime


class ConditionCreate(BaseModel):
    condition_type: str = Field(min_length=1)
    condition_config: dict[str, Any] | None = None


class ConditionUpdate(BaseModel):
    condition_type: str | None = Field(default=None, min_length=1)
    condition_config: dict[str, Any] | None = None


class ConditionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    condition_type: str
    condition_config: dict[str, Any] | None
    created_at: datetime


class ActionCreate(BaseModel):
    action_type: str = Field(min_length=1)
    action_config: dict[str, Any] | None = None
    execution_order: int = Field(default=1, ge=1)


class ActionUpdate(BaseModel):
    action_type: str | None = Field(default=None, min_length=1)
    action_config: dict[str, Any] | None = None
    execution_order: int | None = Field(default=None, ge=1)


class ActionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    action_type: str
    action_config: dict[str, Any] | None
    execution_order: int
    created_at: datetime


class ExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    execution_status: str
    started_at: datetime
    completed_at: datetime | None
    execution_log: str | None


class ScheduleCreate(BaseModel):
    cron_expression: str | None = None
    interval_seconds: int | None = Field(default=None, ge=1)
    next_run_at: datetime | None = None
    is_active: bool = True


class ScheduleUpdate(BaseModel):
    cron_expression: str | None = None
    interval_seconds: int | None = Field(default=None, ge=1)
    next_run_at: datetime | None = None
    is_active: bool | None = None


class ScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int
    cron_expression: str | None
    interval_seconds: int | None
    next_run_at: datetime | None
    is_active: bool
    created_at: datetime


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workflow_id: int | None
    execution_id: int | None
    action: str
    status: str
    metadata_json: dict[str, Any] | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime
