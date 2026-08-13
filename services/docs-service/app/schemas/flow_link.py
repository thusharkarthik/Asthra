from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class PageFlowWorkItemCreate(BaseModel):
    project_id: int
    work_item_type: str = Field(pattern="^(epic|story|task)$")
    reporter_id: int | None = None
    title: str | None = Field(default=None, max_length=255)

    @field_validator("work_item_type")
    @classmethod
    def normalize_work_item_type(cls, value: str) -> str:
        return value.strip().lower()


class DocFlowLinkRead(BaseModel):
    id: int
    docs_page_id: int
    flow_work_item_id: int
    flow_item_type: str
    title: str
    status: str | None = None
    assignee_id: int | None = None
    priority_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
