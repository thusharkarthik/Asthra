from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class FeedbackCreate(BaseModel):
    workspace_id: int
    idea_id: int | None = None
    feature_request_id: int | None = None
    source: str = Field(min_length=1, max_length=100)
    author: str | None = Field(default=None, max_length=255)
    content: str = Field(min_length=1)
    sentiment: str | None = Field(default=None, max_length=50)


class FeedbackRead(TimestampedRead):
    workspace_id: int
    idea_id: int | None = None
    feature_request_id: int | None = None
    source: str
    author: str | None = None
    content: str
    sentiment: str | None = None
