from pydantic import BaseModel, Field
from app.schemas.base import TimestampedRead


class OnCallScheduleCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    timezone: str | None = None
    rotation_notes: str | None = None


class OnCallScheduleRead(TimestampedRead):
    workspace_id: int
    name: str
    timezone: str | None = None
    rotation_notes: str | None = None
