from datetime import datetime

from pydantic import BaseModel, Field


class AuditEventRead(BaseModel):
    id: int
    workspace_id: int | None = None
    project_id: int | None = None
    work_item_id: int | None = None
    entity_type: str
    entity_id: str
    action: str
    actor_id: int | None = None
    actor_name: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    metadata: dict | None = None
    created_at: datetime


class AuditEventCreate(BaseModel):
    workspace_id: int | None = None
    project_id: int | None = None
    work_item_id: int | None = None
    entity_type: str = Field(min_length=1, max_length=100)
    entity_id: str = Field(min_length=1, max_length=100)
    action: str = Field(min_length=1, max_length=100)
    actor_id: int | None = None
    actor_name: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    metadata: dict | None = None
