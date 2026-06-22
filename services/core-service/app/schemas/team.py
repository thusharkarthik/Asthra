from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class TeamCreate(BaseModel):
    workspace_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Team name is required.")
        return name


class TeamUpdate(BaseModel):
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
            raise ValueError("Team name is required.")
        return name


class TeamRead(TimestampedRead):
    workspace_id: int
    name: str
    description: str | None = None
    slug: str
    created_by_id: int
    is_active: bool


class TeamMemberCreate(BaseModel):
    user_id: int
    role_id: int | None = None
    member_role: str = "member"
    status: str = "active"


class TeamMemberRead(TimestampedRead):
    team_id: int
    user_id: int
    role_id: int | None = None
    member_role: str
    status: str = "active"
    joined_at: datetime | None = None


class TeamMemberUpdate(BaseModel):
    role_id: int | None = None
    member_role: str | None = None
    status: str | None = None
