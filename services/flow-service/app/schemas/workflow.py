from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


ALLOWED_WORKFLOW_CATEGORIES = {"backlog", "active", "review", "completed"}


class WorkflowCreate(BaseModel):
    project_id: int | None = None
    workspace_id: int | None = None
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    is_default: bool = False


class WorkflowUpdate(BaseModel):
    project_id: int | None = None
    workspace_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    is_default: bool | None = None


class WorkflowStatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    key: str | None = Field(default=None, max_length=100)
    category: str = "active"
    sort_order: int = 0

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_WORKFLOW_CATEGORIES:
            raise ValueError(f"category must be one of {', '.join(sorted(ALLOWED_WORKFLOW_CATEGORIES))}")
        return normalized


class WorkflowStatusUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    key: str | None = Field(default=None, max_length=100)
    category: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in ALLOWED_WORKFLOW_CATEGORIES:
            raise ValueError(f"category must be one of {', '.join(sorted(ALLOWED_WORKFLOW_CATEGORIES))}")
        return normalized


class WorkflowTransitionCreate(BaseModel):
    from_status_id: int
    to_status_id: int


class WorkflowStatusRead(TimestampedRead):
    workflow_id: int | None = None
    name: str
    key: str
    category: str
    sort_order: int
    is_active: bool


class WorkflowTransitionRead(TimestampedRead):
    workflow_id: int
    from_status_id: int
    to_status_id: int
    from_status_name: str | None = None
    to_status_name: str | None = None


class WorkflowRead(TimestampedRead):
    project_id: int | None = None
    workspace_id: int | None = None
    name: str
    description: str | None = None
    is_default: bool
    statuses: list[WorkflowStatusRead] = Field(default_factory=list)
    transitions: list[WorkflowTransitionRead] = Field(default_factory=list)


class WorkflowAssignProject(BaseModel):
    project_id: int
