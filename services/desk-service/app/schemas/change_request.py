from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class ChangeRequestCreate(BaseModel):
    workspace_id: int
    ticket_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    risk_level: str = Field(default="medium", min_length=1, max_length=50)
    status: str = Field(default="draft", min_length=1, max_length=50)
    requested_by_id: int | None = None


class ChangeRequestUpdate(BaseModel):
    ticket_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    risk_level: str | None = Field(default=None, min_length=1, max_length=50)
    status: str | None = Field(default=None, min_length=1, max_length=50)
    requested_by_id: int | None = None


class ChangeRequestRead(FullTimestampedRead):
    workspace_id: int
    ticket_id: int | None = None
    title: str
    description: str
    risk_level: str
    status: str
    requested_by_id: int | None = None
