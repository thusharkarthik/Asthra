from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class WorkItemTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None


class WorkItemTypeRead(TimestampedRead):
    name: str
    description: str | None = None
    icon: str | None = None
    is_active: bool


class WorkItemStatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    category: str = "todo"
    sort_order: int = 0


class WorkItemStatusRead(TimestampedRead):
    name: str
    description: str | None = None
    category: str
    sort_order: int
    is_active: bool


class WorkItemPriorityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    level: int = 0


class WorkItemPriorityRead(TimestampedRead):
    name: str
    description: str | None = None
    level: int
    is_active: bool


class WorkItemCreate(BaseModel):
    project_id: int
    type_id: int
    status_id: int
    reporter_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    parent_id: int | None = None
    priority_id: int | None = None
    board_id: int | None = None
    board_column_id: int | None = None
    assignee_id: int | None = None
    due_date: datetime | None = None


class WorkItemUpdate(BaseModel):
    type_id: int | None = None
    status_id: int | None = None
    priority_id: int | None = None
    board_id: int | None = None
    board_column_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    assignee_id: int | None = None
    reporter_id: int | None = None
    due_date: datetime | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class WorkItemRead(TimestampedRead):
    project_id: int
    parent_id: int | None = None
    type_id: int
    status_id: int
    priority_id: int | None = None
    board_id: int | None = None
    board_column_id: int | None = None
    title: str
    description: str | None = None
    assignee_id: int | None = None
    reporter_id: int
    due_date: datetime | None = None
    sort_order: int
    is_active: bool


class WorkItemAIBreakdownRead(BaseModel):
    work_item_id: int
    subtasks: list[str] = []
    acceptance_criteria: list[str] = []
    risks: list[str] = []
    dependencies: list[str] = []
    estimated_complexity: str | None = None
    raw_response: str | None = None


class WorkItemMemoryDocumentPayload(BaseModel):
    source_type: str = "work_item"
    external_reference: str
    workspace_id: int
    title: str
    content: str
    metadata: dict
