from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class WorkspaceCreate(BaseModel):
    organization_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Workspace name is required.")
        return name


class WorkspaceUpdate(BaseModel):
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
            raise ValueError("Workspace name is required.")
        return name


class WorkspaceRead(TimestampedRead):
    organization_id: int
    name: str
    description: str | None = None
    slug: str
    created_by_id: int
    is_active: bool


class WorkspaceMemberCreate(BaseModel):
    workspace_id: int
    user_id: int
    role_id: int | None = None
    member_role: str = "member"


class WorkspaceMemberRead(TimestampedRead):
    workspace_id: int
    user_id: int
    role_id: int | None = None
    member_role: str


class WorkspaceMemberUpdate(BaseModel):
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
