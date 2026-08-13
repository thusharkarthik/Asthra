from pydantic import BaseModel, Field
from app.schemas.base import FullTimestampedRead


class PostmortemCreate(BaseModel):
    summary: str = Field(min_length=1)
    root_cause: str | None = None
    action_items: str | None = None


class PostmortemUpdate(BaseModel):
    summary: str | None = Field(default=None, min_length=1)
    root_cause: str | None = None
    action_items: str | None = None


class PostmortemRead(FullTimestampedRead):
    incident_id: int
    summary: str
    root_cause: str | None = None
    action_items: str | None = None
