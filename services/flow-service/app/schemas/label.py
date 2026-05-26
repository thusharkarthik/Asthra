from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class WorkItemLabelCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=100)
    color: str | None = None


class WorkItemLabelUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = None
    is_active: bool | None = None


class WorkItemLabelRead(TimestampedRead):
    project_id: int
    name: str
    color: str | None = None
    is_active: bool


class WorkItemLabelAssign(BaseModel):
    label_id: int
