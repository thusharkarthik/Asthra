from pydantic import BaseModel, Field
from app.schemas.base import TimestampedRead


class TimelineEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1)
    created_by_id: int | None = None


class TimelineEventRead(TimestampedRead):
    incident_id: int
    event_type: str
    content: str
    created_by_id: int | None = None
