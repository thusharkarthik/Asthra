from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class TicketCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    queue_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    requester_name: str | None = Field(default=None, max_length=255)
    requester_email: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    status: str = Field(default="open", min_length=1, max_length=50)
    priority: str = Field(default="medium", min_length=1, max_length=50)
    requester_id: int | None = None
    assignee_id: int | None = None
    created_by: int | None = None


class TicketUpdate(BaseModel):
    project_id: int | None = None
    queue_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    requester_name: str | None = Field(default=None, max_length=255)
    requester_email: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, min_length=1, max_length=50)
    priority: str | None = Field(default=None, min_length=1, max_length=50)
    requester_id: int | None = None
    assignee_id: int | None = None
    created_by: int | None = None


class TicketRead(FullTimestampedRead):
    workspace_id: int
    project_id: int | None = None
    queue_id: int | None = None
    title: str
    description: str
    requester_name: str | None = None
    requester_email: str | None = None
    category: str | None = None
    status: str
    priority: str
    requester_id: int | None = None
    assignee_id: int | None = None
    created_by: int | None = None


class TicketAIClassificationRead(BaseModel):
    ticket_id: int
    category: str | None = None
    priority_suggestion: str | None = None
    severity_suggestion: str | None = None
    routing_suggestion: str | None = None
    possible_duplicate_hints: list[str] = []
    recommended_next_action: str | None = None
    raw_response: str | None = None


class TicketMemoryDocumentPayload(BaseModel):
    source_type: str = "support_ticket"
    external_reference: str
    workspace_id: int
    title: str
    content: str
    metadata: dict
