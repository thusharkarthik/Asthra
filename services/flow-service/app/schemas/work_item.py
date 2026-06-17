from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


ALLOWED_ITEM_LEVELS = {"initiative", "feature", "work_item", "subtask"}
ALLOWED_RELATION_TYPES = {"blocks", "blocked_by", "related_to", "duplicate_of"}
ALLOWED_LINKED_ENTITY_TYPES = {
    "work_item",
    "doc_page",
    "discover_idea",
    "desk_ticket",
    "pulse_incident",
    "dev_release",
}


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
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    status_name: str | None = Field(default=None, min_length=1, max_length=100)
    priority_id: Optional[int] = None
    sprint_id: int | None = None
    priority_name: str | None = Field(default=None, min_length=1, max_length=100)
    reporter_id: Optional[int] = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None)
    item_level: str = "work_item"
    parent_id: int | None = Field(default=None)
    board_id: int | None = Field(default=None)
    board_column_id: int | None = Field(default=None)
    assignee_id: Optional[int] = None
    due_date: datetime | None = Field(default=None)
    effort_score: int | None = Field(default=None, gt=0)
    effort_size: str | None = None
    business_value: str | None = None
    risk_level: str | None = None
    complexity: str | None = None
    acceptance_criteria: str | None = None
    definition_of_done: str | None = None

    @field_validator("effort_size")
    @classmethod
    def validate_effort_size(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().upper()
        if normalized not in {"XS", "S", "M", "L", "XL"}:
            raise ValueError("effort_size must be one of XS, S, M, L, XL")
        return normalized

    @field_validator("business_value")
    @classmethod
    def validate_business_value(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high", "critical"}, "business_value")

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high"}, "risk_level")

    @field_validator("complexity")
    @classmethod
    def validate_complexity(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high"}, "complexity")

    @field_validator("item_level")
    @classmethod
    def validate_item_level(cls, value: str) -> str:
        return validate_required_choice(value, ALLOWED_ITEM_LEVELS, "item_level")


class WorkItemUpdate(BaseModel):
    type_id: int | None = None
    status_id: int | None = None
    status_name: str | None = Field(default=None, min_length=1, max_length=100)
    priority_id: int | None = None
    sprint_id: int | None = None
    priority_name: str | None = Field(default=None, min_length=1, max_length=100)
    parent_id: int | None = None
    board_id: int | None = None
    board_column_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    item_level: str | None = None
    assignee_id: int | None = None
    reporter_id: int | None = None
    due_date: datetime | None = None
    effort_score: int | None = Field(default=None, gt=0)
    effort_size: str | None = None
    business_value: str | None = None
    risk_level: str | None = None
    complexity: str | None = None
    acceptance_criteria: str | None = None
    definition_of_done: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("effort_size")
    @classmethod
    def validate_effort_size(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().upper()
        if normalized not in {"XS", "S", "M", "L", "XL"}:
            raise ValueError("effort_size must be one of XS, S, M, L, XL")
        return normalized

    @field_validator("business_value")
    @classmethod
    def validate_business_value(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high", "critical"}, "business_value")

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high"}, "risk_level")

    @field_validator("complexity")
    @classmethod
    def validate_complexity(cls, value: str | None) -> str | None:
        return validate_choice(value, {"low", "medium", "high"}, "complexity")

    @field_validator("item_level")
    @classmethod
    def validate_item_level(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return validate_required_choice(value, ALLOWED_ITEM_LEVELS, "item_level")


class WorkItemRead(TimestampedRead):
    project_id: int
    parent_id: int | None = None
    type_id: int
    status_id: int
    priority_id: int | None = None
    sprint_id: int | None = None
    board_id: int | None = None
    board_column_id: int | None = None
    title: str
    description: str | None = None
    item_level: str
    assignee_id: int | None = None
    reporter_id: int | None = None
    due_date: datetime | None = None
    effort_score: int | None = None
    effort_size: str | None = None
    business_value: str | None = None
    risk_level: str | None = None
    complexity: str | None = None
    acceptance_criteria: str | None = None
    definition_of_done: str | None = None
    sort_order: int
    is_active: bool


class WorkItemParentUpdate(BaseModel):
    parent_id: int | None = None


class WorkItemRelationCreate(BaseModel):
    target_work_item_id: int
    relation_type: str
    description: str | None = None
    created_by_id: int | None = None

    @field_validator("relation_type")
    @classmethod
    def validate_relation_type(cls, value: str) -> str:
        return validate_required_choice(value, ALLOWED_RELATION_TYPES, "relation_type")


class WorkItemRelationRead(TimestampedRead):
    source_work_item_id: int
    target_work_item_id: int
    relation_type: str
    description: str | None = None
    created_by_id: int | None = None
    target_title: str | None = None
    target_status_id: int | None = None
    target_priority_id: int | None = None


class LinkedEntityCreate(BaseModel):
    entity_type: str
    entity_id: str
    entity_title: str = Field(min_length=1, max_length=255)
    entity_url: str | None = Field(default=None, max_length=500)

    @field_validator("entity_type")
    @classmethod
    def validate_entity_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_LINKED_ENTITY_TYPES:
            allowed = ", ".join(sorted(ALLOWED_LINKED_ENTITY_TYPES))
            raise ValueError(f"entity_type must be one of: {allowed}")
        return normalized

    @field_validator("entity_id")
    @classmethod
    def validate_entity_id(cls, value: str) -> str:
        normalized = str(value).strip()
        if not normalized:
            raise ValueError("entity_id is required")
        return normalized


class LinkedEntityRead(TimestampedRead):
    work_item_id: int
    entity_type: str
    entity_id: str
    entity_title: str
    entity_url: str | None = None


class WorkItemHierarchyNode(BaseModel):
    id: int
    project_id: int
    parent_id: int | None = None
    item_level: str
    title: str
    status_id: int | None = None
    priority_id: int | None = None
    children: list["WorkItemHierarchyNode"] = Field(default_factory=list)


class ProjectHierarchyRead(BaseModel):
    project_id: int
    items: list[WorkItemHierarchyNode]


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


def validate_choice(value: str | None, allowed: set[str], field_name: str) -> str | None:
    if value is None:
        return value
    normalized = value.strip().lower()
    if normalized not in allowed:
        raise ValueError(f"{field_name} must be one of {', '.join(sorted(allowed))}")
    return normalized


def validate_required_choice(value: str, allowed: set[str], field_name: str) -> str:
    normalized = value.strip().lower()
    if normalized not in allowed:
        raise ValueError(f"{field_name} must be one of {', '.join(sorted(allowed))}")
    return normalized
