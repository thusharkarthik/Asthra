from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class WorkItemAttachmentCreate(BaseModel):
    work_item_id: int
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    file_size: int | None = None
    storage_key: str | None = None
    external_url: str | None = None


class WorkItemAttachmentRead(TimestampedRead):
    work_item_id: int
    uploaded_by_id: int
    file_name: str
    content_type: str | None = None
    file_size: int | None = None
    storage_key: str | None = None
    external_url: str | None = None
    is_active: bool
