from pydantic import BaseModel, Field
from app.schemas.base import FullTimestampedRead, TimestampedRead


class StatusPageCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    is_public: bool = False


class StatusPageRead(TimestampedRead):
    workspace_id: int
    name: str
    description: str | None = None
    is_public: bool


class StatusPageComponentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    status: str = "operational"
    description: str | None = None


class StatusPageComponentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = None
    description: str | None = None


class StatusPageComponentRead(FullTimestampedRead):
    status_page_id: int
    name: str
    status: str
    description: str | None = None
