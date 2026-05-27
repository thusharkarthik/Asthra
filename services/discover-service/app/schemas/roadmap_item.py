from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class RoadmapItemCreate(BaseModel):
    workspace_id: int
    idea_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    target_quarter: str | None = Field(default=None, max_length=20)
    status: str = Field(default="planned", min_length=1, max_length=50)
    sort_order: int | None = None


class RoadmapItemUpdate(BaseModel):
    idea_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    target_quarter: str | None = Field(default=None, max_length=20)
    status: str | None = Field(default=None, min_length=1, max_length=50)
    sort_order: int | None = None


class RoadmapItemRead(FullTimestampedRead):
    workspace_id: int
    idea_id: int | None = None
    title: str
    description: str | None = None
    target_quarter: str | None = None
    status: str
    sort_order: int | None = None
