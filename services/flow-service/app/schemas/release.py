from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


ALLOWED_RELEASE_STATUSES = {"planned", "active", "released", "cancelled"}


def validate_release_status(value: str) -> str:
    normalized = value.strip().lower()
    if normalized not in ALLOWED_RELEASE_STATUSES:
        allowed = ", ".join(sorted(ALLOWED_RELEASE_STATUSES))
        raise ValueError(f"status must be one of: {allowed}")
    return normalized


class ReleaseCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    version: str = Field(min_length=1, max_length=100)
    description: str | None = None
    target_date: datetime | None = None
    actual_release_date: datetime | None = None
    status: str = "planned"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return validate_release_status(value)


class ReleaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    version: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    target_date: datetime | None = None
    actual_release_date: datetime | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return validate_release_status(value)


class ReleaseRead(TimestampedRead):
    project_id: int
    name: str
    version: str
    description: str | None = None
    target_date: datetime | None = None
    actual_release_date: datetime | None = None
    status: str
    work_item_count: int
    completed_work_count: int
    completion_percentage: int


class ReleaseAssignWorkItem(BaseModel):
    work_item_id: int
