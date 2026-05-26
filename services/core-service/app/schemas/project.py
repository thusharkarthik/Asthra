from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class ProjectCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    status: str = "active"
    owner_id: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Project name is required.")
        return name


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = None
    owner_id: int | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        name = value.strip()
        if not name:
            raise ValueError("Project name is required.")
        return name


class ProjectRead(TimestampedRead):
    workspace_id: int
    team_id: int | None = None
    name: str
    key: str
    description: str | None = None
    status: str
    owner_id: int | None = None
    created_by_id: int
    is_active: bool


class ProjectTeamCreate(BaseModel):
    team_id: int


class ProjectTeamRead(TimestampedRead):
    project_id: int
    team_id: int
