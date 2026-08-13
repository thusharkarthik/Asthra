from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Organization name is required.")
        return name


class PlatformOnboardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    owner_user_id: int

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Organization name is required.")
        return name


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        name = value.strip()
        if not name:
            raise ValueError("Organization name is required.")
        return name


class OrganizationRead(TimestampedRead):
    name: str
    description: str | None = None
    slug: str
    created_by_id: int
    is_active: bool
    owner_name: str | None = None


class OrganizationMemberCreate(BaseModel):
    organization_id: int
    user_id: int
    role_id: int | None = None
    member_role: str = "member"


class OrganizationMemberRead(TimestampedRead):
    organization_id: int
    user_id: int
    role_id: int | None = None
    member_role: str


class OrganizationMemberUpdate(BaseModel):
    role_id: int | None = None
    member_role: str | None = Field(default=None, min_length=1, max_length=50)

    @field_validator("member_role")
    @classmethod
    def validate_member_role(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Member role is required.")
        return normalized


class OrgHealthCheck(BaseModel):
    key: str
    label: str
    passed: bool
    points: int


class OrgHealthScore(BaseModel):
    organization_id: int
    score: int
    status: str
    checks: list[OrgHealthCheck]
    checked_at: datetime
