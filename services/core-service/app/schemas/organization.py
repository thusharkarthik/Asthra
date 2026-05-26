from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class OrganizationCreate(BaseModel):
    name: str
    slug: str


class OrganizationRead(TimestampedRead):
    name: str
    slug: str


class OrganizationMemberCreate(BaseModel):
    organization_id: int
    user_id: int
    role_id: int | None = None


class OrganizationMemberRead(TimestampedRead):
    organization_id: int
    user_id: int
    role_id: int | None = None
