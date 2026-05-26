from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class ActivityLogCreate(BaseModel):
    actor_user_id: int | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    description: str | None = None
    metadata: dict | None = None


class ActivityLogFilter(BaseModel):
    entity_type: str | None = None
    action: str | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    actor_user_id: int | None = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class ActivityLogRead(TimestampedRead):
    actor_user_id: int | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    description: str | None = None
    summary: str | None = None
    event_metadata: dict | None = None
