from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead
from app.schemas.user import UserRead


VALID_SCOPES = {"platform", "organization", "workspace", "project", "team"}
VALID_STATUSES = {"active", "inactive", "revoked"}


class RoleAssignmentCreate(BaseModel):
    user_id: int
    role_id: int
    scope_type: str
    scope_id: int | None = None
    status: str = "active"

    @field_validator("scope_type")
    @classmethod
    def validate_scope_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_SCOPES:
            raise ValueError("Unsupported role assignment scope.")
        return normalized

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_STATUSES:
            raise ValueError("Role assignment status must be active, inactive, or revoked.")
        return normalized


class RoleAssignmentUpdate(BaseModel):
    role_id: int | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in VALID_STATUSES:
            raise ValueError("Role assignment status must be active, inactive, or revoked.")
        return normalized


class RoleAssignmentRead(TimestampedRead):
    user_id: int
    role_id: int
    scope_type: str
    scope_id: int | None = None
    status: str
    assigned_by: int | None = None
    assigned_at: datetime | None = None
    revoked_at: datetime | None = None


class ProjectMembershipCreate(BaseModel):
    user_id: int
    role_id: int | None = None
    team_id: int | None = None
    status: str = "active"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"active", "inactive"}:
            raise ValueError("Project membership status must be active or inactive.")
        return normalized


class ProjectMembershipUpdate(BaseModel):
    role_id: int | None = None
    team_id: int | None = None
    status: str | None = Field(default=None)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in {"active", "inactive"}:
            raise ValueError("Project membership status must be active or inactive.")
        return normalized


class ProjectMembershipRead(TimestampedRead):
    project_id: int
    user_id: int
    role_id: int | None = None
    team_id: int | None = None
    status: str
    joined_at: datetime | None = None


class EffectivePermissionsRead(BaseModel):
    user: UserRead
    active_roles: list[dict]
    inherited_roles: list[dict]
    permission_codes: list[str]
    scope_context: dict
