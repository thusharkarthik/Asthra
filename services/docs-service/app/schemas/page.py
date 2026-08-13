from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class PageCreate(BaseModel):
    space_id: int
    parent_page_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    status: str = "draft"
    created_by_id: int
    discover_idea_id: int | None = None


class PageUpdate(BaseModel):
    parent_page_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    status: str | None = None
    updated_by_id: int | None = None
    is_active: bool | None = None
    discover_idea_id: int | None = None


class PageRead(TimestampedRead):
    space_id: int
    parent_page_id: int | None = None
    title: str
    content: str
    status: str
    created_by_id: int
    updated_by_id: int | None = None
    discover_idea_id: int | None = None
    is_active: bool


class PageMemoryDocumentPayload(BaseModel):
    title: str
    content: str
    workspace_id: int
    source_type: str = "docs_page"
    external_reference: str
    metadata: dict


class PageAISummaryRead(BaseModel):
    page_id: int
    short_summary: str | None = None
    key_points: list[str] = []
    action_items: list[str] = []
    related_questions: list[str] = []
    raw_response: str | None = None


class PageVersionCreate(BaseModel):
    page_id: int
    version_number: int
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    created_by_id: int


class PageVersionRead(BaseModel):
    id: int
    page_id: int
    version_number: int
    title: str
    content: str
    created_by_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
