from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.base import TimestampedRead


class InvitationCreate(BaseModel):
    email: EmailStr
    organization_id: int
    workspace_id: int | None = None
    role_id: int | None = None


class InvitationAccept(BaseModel):
    token: str


class InvitationRead(TimestampedRead):
    email: EmailStr
    organization_id: int
    workspace_id: int | None = None
    invited_by_id: int
    role_id: int | None = None
    status: str
    token: str
    expires_at: datetime


class MembershipRead(TimestampedRead):
    user_id: int
    organization_id: int | None = None
    workspace_id: int | None = None
    role_id: int | None = None
    member_role: str
