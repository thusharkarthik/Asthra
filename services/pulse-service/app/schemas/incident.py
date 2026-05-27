from pydantic import BaseModel, Field
from app.schemas.base import FullTimestampedRead


class IncidentCreate(BaseModel):
    workspace_id: int
    alert_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    severity: str = "medium"
    status: str = "investigating"
    commander_id: int | None = None


class IncidentUpdate(BaseModel):
    alert_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    commander_id: int | None = None


class IncidentRead(FullTimestampedRead):
    workspace_id: int
    alert_id: int | None = None
    title: str
    description: str | None = None
    severity: str
    status: str
    commander_id: int | None = None
