from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class WorkItemAttachmentCreate(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_url: str = Field(min_length=1, max_length=1000)
    file_type: str | None = None
    file_size: int | None = None
    uploaded_by_id: int | None = None


class WorkItemAttachmentRead(TimestampedRead):
    work_item_id: int
    uploaded_by_id: int | None = None
    file_name: str
    file_url: str
    file_type: str | None = None
    file_size: int | None = None
    uploaded_at: datetime | None = None
    is_active: bool
