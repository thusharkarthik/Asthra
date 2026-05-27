from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class FeatureRequestCreate(BaseModel):
    idea_id: int | None = None
    workspace_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    source: str | None = Field(default=None, max_length=100)
    requested_by: str | None = Field(default=None, max_length=255)
    status: str = Field(default="new", min_length=1, max_length=50)


class FeatureRequestUpdate(BaseModel):
    idea_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    source: str | None = Field(default=None, max_length=100)
    requested_by: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, min_length=1, max_length=50)


class FeatureRequestRead(FullTimestampedRead):
    idea_id: int | None = None
    workspace_id: int
    title: str
    description: str
    source: str | None = None
    requested_by: str | None = None
    status: str
