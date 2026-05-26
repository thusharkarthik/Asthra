from datetime import datetime

from pydantic import BaseModel, Field


class PageAttachmentCreate(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_url: str = Field(min_length=1, max_length=1000)
    file_type: str | None = None
    file_size: int | None = None
    uploaded_by_id: int


class PageAttachmentRead(BaseModel):
    id: int
    page_id: int
    file_name: str
    file_url: str
    file_type: str | None = None
    file_size: int | None = None
    uploaded_by_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
