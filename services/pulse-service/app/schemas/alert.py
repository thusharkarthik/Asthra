from pydantic import BaseModel, Field
from app.schemas.base import FullTimestampedRead


class AlertCreate(BaseModel):
    workspace_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    source: str | None = None
    severity: str = "medium"
    status: str = "open"


class AlertUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    source: str | None = None
    severity: str | None = None
    status: str | None = None


class AlertRead(FullTimestampedRead):
    workspace_id: int
    title: str
    description: str | None = None
    source: str | None = None
    severity: str
    status: str
