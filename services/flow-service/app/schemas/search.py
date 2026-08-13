from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.work_item import WorkItemRead


ALLOWED_SEARCH_SORTS = {"created_at", "updated_at", "priority", "due_date"}
ALLOWED_SORT_DIRECTIONS = {"asc", "desc"}


class WorkItemSearchParams(BaseModel):
    text: str | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: int | None = None
    reporter_id: int | None = None
    effort_size: str | None = None
    business_value: str | None = None
    risk_level: str | None = None
    complexity: str | None = None
    sprint_id: int | None = None
    release_id: int | None = None
    parent_id: int | None = None
    item_level: str | None = None
    created_after: datetime | None = None
    created_before: datetime | None = None
    updated_after: datetime | None = None
    updated_before: datetime | None = None
    due_before: datetime | None = None
    due_after: datetime | None = None
    project_id: int | None = None
    sort_by: str = "updated_at"
    sort_direction: str = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, value: str) -> str:
        if value not in ALLOWED_SEARCH_SORTS:
            allowed = ", ".join(sorted(ALLOWED_SEARCH_SORTS))
            raise ValueError(f"sort_by must be one of: {allowed}")
        return value

    @field_validator("sort_direction")
    @classmethod
    def validate_sort_direction(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in ALLOWED_SORT_DIRECTIONS:
            allowed = ", ".join(sorted(ALLOWED_SORT_DIRECTIONS))
            raise ValueError(f"sort_direction must be one of: {allowed}")
        return normalized


class WorkItemSearchResponse(BaseModel):
    items: list[WorkItemRead]
    total: int
    page: int
    page_size: int
