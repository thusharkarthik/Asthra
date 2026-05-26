from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class ActivityLogCreate(BaseModel):
    actor_user_id: int | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    summary: str | None = None


class ActivityLogRead(TimestampedRead):
    actor_user_id: int | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    summary: str | None = None
