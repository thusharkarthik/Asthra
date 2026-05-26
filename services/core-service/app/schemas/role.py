from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class RoleCreate(BaseModel):
    organization_id: int
    name: str
    key: str


class RoleRead(TimestampedRead):
    organization_id: int
    name: str
    key: str


class PermissionCreate(BaseModel):
    role_id: int
    key: str
    description: str | None = None


class PermissionRead(TimestampedRead):
    role_id: int
    key: str
    description: str | None = None
