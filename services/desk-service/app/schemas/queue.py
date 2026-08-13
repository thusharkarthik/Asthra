from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class QueueCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class QueueRead(TimestampedRead):
    workspace_id: int
    name: str
    description: str | None = None
