from pydantic import BaseModel


class OrganizationSettingsRead(BaseModel):
    default_timezone: str | None = None
    allow_public_invites: bool = False
    default_member_role: str = "member"


class OrganizationSettingsUpdate(BaseModel):
    default_timezone: str | None = None
    allow_public_invites: bool | None = None
    default_member_role: str | None = None


class WorkspaceSettingsRead(BaseModel):
    default_project_visibility: str = "private"
    default_timezone: str | None = None
    enable_activity_feed: bool = True


class WorkspaceSettingsUpdate(BaseModel):
    default_project_visibility: str | None = None
    default_timezone: str | None = None
    enable_activity_feed: bool | None = None
