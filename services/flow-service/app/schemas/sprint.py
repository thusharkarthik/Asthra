from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


ALLOWED_SPRINT_STATUSES = {"planned", "active", "completed", "cancelled"}


class SprintCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str = "planned"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_SPRINT_STATUSES:
            allowed = ", ".join(sorted(ALLOWED_SPRINT_STATUSES))
            raise ValueError(f"status must be one of: {allowed}")
        return normalized


class SprintUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in ALLOWED_SPRINT_STATUSES:
            allowed = ", ".join(sorted(ALLOWED_SPRINT_STATUSES))
            raise ValueError(f"status must be one of: {allowed}")
        return normalized


class SprintRead(TimestampedRead):
    project_id: int
    name: str
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str
    planned_work_count: int = 0
    completed_work_count: int = 0
    total_effort: int = 0


class SprintAssignWorkItem(BaseModel):
    work_item_id: int
