from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class SLACreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    response_time_minutes: int = Field(default=60, ge=1)
    resolution_time_minutes: int = Field(default=1440, ge=1)
    priority: str = Field(default="medium", min_length=1, max_length=50)


class SLARead(TimestampedRead):
    workspace_id: int
    name: str
    description: str | None = None
    response_time_minutes: int
    resolution_time_minutes: int
    priority: str
