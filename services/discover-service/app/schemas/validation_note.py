from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class ValidationNoteCreate(BaseModel):
    note_type: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1)
    created_by_id: int | None = None


class ValidationNoteRead(TimestampedRead):
    idea_id: int
    note_type: str
    content: str
    created_by_id: int | None = None
