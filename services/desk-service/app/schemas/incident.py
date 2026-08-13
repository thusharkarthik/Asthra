from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class IncidentCreate(BaseModel):
    workspace_id: int
    ticket_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    severity: str = Field(default="medium", min_length=1, max_length=50)
    status: str = Field(default="open", min_length=1, max_length=50)


class IncidentUpdate(BaseModel):
    ticket_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    severity: str | None = Field(default=None, min_length=1, max_length=50)
    status: str | None = Field(default=None, min_length=1, max_length=50)


class IncidentRead(FullTimestampedRead):
    workspace_id: int
    ticket_id: int | None = None
    title: str
    description: str
    severity: str
    status: str
