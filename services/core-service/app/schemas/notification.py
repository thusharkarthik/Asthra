from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class AccessRequestCreate(BaseModel):
    page: str
    message: str | None = None


class NotificationCreateInternal(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    entity_type: str | None = None
    entity_id: str | None = None


class NotificationFilter(BaseModel):
    is_read: bool | None = None
    type: str | None = None
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class NotificationRead(TimestampedRead):
    user_id: int
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    type: str
    title: str
    message: str
    entity_type: str | None = None
    entity_id: str | None = None
    is_read: bool
    read_at: datetime | None = None
