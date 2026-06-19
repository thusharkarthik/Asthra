from datetime import datetime

from pydantic import BaseModel, EmailStr, computed_field

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

    @computed_field
    @property
    def scope_type(self) -> str:
        return "workspace" if self.workspace_id is not None else "organization"

    @computed_field
    @property
    def scope_id(self) -> int:
        return self.workspace_id if self.workspace_id is not None else self.organization_id

    @computed_field
    @property
    def invited_at(self) -> datetime:
        return self.created_at

    @computed_field
    @property
    def accepted_at(self) -> datetime | None:
        return self.updated_at if self.status == "accepted" else None

    @computed_field
    @property
    def cancelled_at(self) -> datetime | None:
        return self.updated_at if self.status == "cancelled" else None


class MembershipRead(TimestampedRead):
    user_id: int
    organization_id: int | None = None
    workspace_id: int | None = None
    role_id: int | None = None
    member_role: str
