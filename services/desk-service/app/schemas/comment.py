from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class TicketCommentCreate(BaseModel):
    author_id: int | None = None
    content: str = Field(min_length=1)


class TicketCommentRead(TimestampedRead):
    ticket_id: int
    author_id: int | None = None
    content: str
