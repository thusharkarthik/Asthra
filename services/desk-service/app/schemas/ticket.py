from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class TicketCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    queue_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    status: str = Field(default="open", min_length=1, max_length=50)
    priority: str = Field(default="medium", min_length=1, max_length=50)
    requester_id: int | None = None
    assignee_id: int | None = None


class TicketUpdate(BaseModel):
    project_id: int | None = None
    queue_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    status: str | None = Field(default=None, min_length=1, max_length=50)
    priority: str | None = Field(default=None, min_length=1, max_length=50)
    requester_id: int | None = None
    assignee_id: int | None = None


class TicketRead(FullTimestampedRead):
    workspace_id: int
    project_id: int | None = None
    queue_id: int | None = None
    title: str
    description: str
    status: str
    priority: str
    requester_id: int | None = None
    assignee_id: int | None = None


class TicketAIClassificationRead(BaseModel):
    ticket_id: int
    category: str | None = None
    priority_suggestion: str | None = None
    severity_suggestion: str | None = None
    routing_suggestion: str | None = None
    possible_duplicate_hints: list[str] = []
    recommended_next_action: str | None = None
    raw_response: str | None = None
