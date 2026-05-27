from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

RESOURCE_STATUSES = {"draft", "active", "archived"}
RUN_STATUSES = {"pending", "running", "success", "failed"}
SEVERITIES = {"info", "warning", "high", "critical"}


def _one_of(value: str, allowed: set[str], label: str) -> str:
    if value not in allowed:
        raise ValueError(f"{label} must be one of: {', '.join(sorted(allowed))}")
    return value


class DashboardCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    description: str | None = None
    created_by_id: int | None = None
    layout_config: dict[str, Any] | None = None


class DashboardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    layout_config: dict[str, Any] | None = None


class DashboardRead(DashboardCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class DashboardWidgetCreate(BaseModel):
    widget_type: str = Field(min_length=1)
    title: str = Field(min_length=1)
    config: dict[str, Any] | None = None
    sort_order: int | None = None


class DashboardWidgetUpdate(BaseModel):
    widget_type: str | None = Field(default=None, min_length=1)
    title: str | None = Field(default=None, min_length=1)
    config: dict[str, Any] | None = None
    sort_order: int | None = None


class DashboardWidgetRead(DashboardWidgetCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dashboard_id: int
    created_at: datetime
    updated_at: datetime


class MetricDefinitionCreate(BaseModel):
    workspace_id: int
    metric_key: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    unit: str | None = None
    source_service: str | None = None


class MetricDefinitionUpdate(BaseModel):
    metric_key: str | None = Field(default=None, min_length=1)
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    unit: str | None = None
    source_service: str | None = None


class MetricDefinitionRead(MetricDefinitionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class MetricSnapshotCreate(BaseModel):
    workspace_id: int
    metric_key: str = Field(min_length=1)
    value: float
    entity_type: str | None = None
    entity_id: int | None = None
    dimensions: dict[str, Any] | None = None
    captured_at: datetime | None = None


class MetricSnapshotRead(MetricSnapshotCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    captured_at: datetime


class ReportCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    report_type: str = Field(min_length=1)
    status: str = "draft"
    config: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, RESOURCE_STATUSES, "report status")


class ReportUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    report_type: str | None = Field(default=None, min_length=1)
    status: str | None = None
    config: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, RESOURCE_STATUSES, "report status") if value is not None else value


class ReportRead(ReportCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ReportRunCreate(BaseModel):
    status: str = "pending"
    result: dict[str, Any] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, RUN_STATUSES, "run status")


class ReportRunRead(ReportRunCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    created_at: datetime


class InsightEventCreate(BaseModel):
    workspace_id: int
    event_type: str = Field(min_length=1)
    severity: str = "info"
    title: str = Field(min_length=1)
    description: str | None = None
    metadata_json: dict[str, Any] | None = Field(default=None, alias="metadata")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        return _one_of(value, SEVERITIES, "severity")


class InsightEventRead(InsightEventCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    created_at: datetime


class UsageMetricCreate(BaseModel):
    workspace_id: int
    service_name: str = Field(min_length=1)
    metric_name: str = Field(min_length=1)
    value: float
    dimensions: dict[str, Any] | None = None
    captured_at: datetime | None = None


class UsageMetricRead(UsageMetricCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    captured_at: datetime
