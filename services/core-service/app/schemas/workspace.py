from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class WorkspaceCreate(BaseModel):
    organization_id: int
    name: str
    slug: str


class WorkspaceRead(TimestampedRead):
    organization_id: int
    name: str
    slug: str


class WorkspaceMemberCreate(BaseModel):
    workspace_id: int
    user_id: int
    role_id: int | None = None


class WorkspaceMemberRead(TimestampedRead):
    workspace_id: int
    user_id: int
    role_id: int | None = None
