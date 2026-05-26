from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class WorkItemCommentCreate(BaseModel):
    author_user_id: int
    body: str = Field(min_length=1)


class WorkItemCommentUpdate(BaseModel):
    body: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class WorkItemCommentRead(TimestampedRead):
    work_item_id: int
    author_user_id: int
    body: str
    is_active: bool
