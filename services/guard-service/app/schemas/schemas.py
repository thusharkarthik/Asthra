from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

POLICY_STATUSES = {"draft", "active", "disabled", "archived"}
REVIEW_STATUSES = {"pending", "in_progress", "completed"}
RISK_STATUSES = {"open", "accepted", "mitigated", "closed"}
SEVERITIES = {"low", "medium", "high", "critical"}


def _one_of(value: str, allowed: set[str], label: str) -> str:
    if value not in allowed:
        raise ValueError(f"{label} must be one of: {', '.join(sorted(allowed))}")
    return value


class SecurityPolicyCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    policy_type: str = Field(min_length=1)
    status: str = "draft"
    description: str | None = None
    rules: dict[str, Any] | None = None
    created_by_id: int | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, POLICY_STATUSES, "policy status")


class SecurityPolicyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    policy_type: str | None = Field(default=None, min_length=1)
    status: str | None = None
    description: str | None = None
    rules: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, POLICY_STATUSES, "policy status") if value is not None else value


class SecurityPolicyRead(SecurityPolicyCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class AccessReviewCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    status: str = "pending"
    reviewer_id: int | None = None
    scope: str | None = None
    findings: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, REVIEW_STATUSES, "review status")


class AccessReviewUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    status: str | None = None
    reviewer_id: int | None = None
    scope: str | None = None
    findings: dict[str, Any] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, REVIEW_STATUSES, "review status") if value is not None else value


class AccessReviewRead(AccessReviewCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ComplianceCheckCreate(BaseModel):
    workspace_id: int
    framework: str = Field(min_length=1)
    control: str = Field(min_length=1)
    status: str = "pending"
    evidence: dict[str, Any] | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, REVIEW_STATUSES, "check status")


class ComplianceCheckUpdate(BaseModel):
    framework: str | None = Field(default=None, min_length=1)
    control: str | None = Field(default=None, min_length=1)
    status: str | None = None
    evidence: dict[str, Any] | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, REVIEW_STATUSES, "check status") if value is not None else value


class ComplianceCheckRead(ComplianceCheckCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class AuditEventCreate(BaseModel):
    workspace_id: int | None = None
    actor_user_id: int | None = None
    entity_type: str | None = None
    entity_id: int | None = None
    action: str = Field(min_length=1)
    severity: str = "low"
    metadata_json: dict[str, Any] | None = Field(default=None, alias="metadata")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        return _one_of(value, SEVERITIES, "severity")


class AuditEventRead(AuditEventCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    created_at: datetime


class DataRetentionPolicyCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    data_type: str = Field(min_length=1)
    retention_days: int = Field(ge=1)
    status: str = "draft"
    description: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, POLICY_STATUSES, "policy status")


class DataRetentionPolicyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    data_type: str | None = Field(default=None, min_length=1)
    retention_days: int | None = Field(default=None, ge=1)
    status: str | None = None
    description: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, POLICY_STATUSES, "policy status") if value is not None else value


class DataRetentionPolicyRead(DataRetentionPolicyCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class RiskFindingCreate(BaseModel):
    workspace_id: int
    title: str = Field(min_length=1)
    description: str | None = None
    severity: str = "medium"
    status: str = "open"
    source: str | None = None
    owner_id: int | None = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        return _one_of(value, SEVERITIES, "severity")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, RISK_STATUSES, "risk status")


class RiskFindingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    source: str | None = None
    owner_id: int | None = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str | None) -> str | None:
        return _one_of(value, SEVERITIES, "severity") if value is not None else value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, RISK_STATUSES, "risk status") if value is not None else value


class RiskFindingRead(RiskFindingCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class SecurityExceptionCreate(BaseModel):
    workspace_id: int
    title: str = Field(min_length=1)
    reason: str = Field(min_length=1)
    status: str = "open"
    requested_by_id: int | None = None
    expires_at: datetime | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _one_of(value, RISK_STATUSES, "exception status")


class SecurityExceptionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    reason: str | None = Field(default=None, min_length=1)
    status: str | None = None
    requested_by_id: int | None = None
    expires_at: datetime | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        return _one_of(value, RISK_STATUSES, "exception status") if value is not None else value


class SecurityExceptionRead(SecurityExceptionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
