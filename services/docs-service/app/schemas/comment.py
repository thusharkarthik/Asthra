from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class PageCommentCreate(BaseModel):
    user_id: int
    content: str = Field(min_length=1)


class PageCommentUpdate(BaseModel):
    content: str = Field(min_length=1)


class PageCommentRead(TimestampedRead):
    page_id: int
    user_id: int
    content: str
