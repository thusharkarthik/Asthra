from pydantic import BaseModel, Field


class OrganizationSettingsRead(BaseModel):
    # Operational defaults
    default_timezone: str | None = None
    allow_public_invites: bool = False
    default_member_role: str = "member"
    # Identity & contact
    domain: str | None = None
    website_url: str | None = None
    industry: str | None = None
    # Branding
    logo_url: str | None = None
    primary_color: str | None = None
    # Localization
    locale: str | None = None
    date_format: str | None = None


class OrganizationSettingsUpdate(BaseModel):
    # Operational defaults
    default_timezone: str | None = None
    allow_public_invites: bool | None = None
    default_member_role: str | None = None
    # Identity & contact
    domain: str | None = None
    website_url: str | None = None
    industry: str | None = None
    # Branding
    logo_url: str | None = None
    primary_color: str | None = None
    # Localization
    locale: str | None = None
    date_format: str | None = None


ALL_MODULES = ["flow", "docs", "discover", "desk", "pulse", "collab", "automation"]


class WorkspaceSettingsRead(BaseModel):
    default_project_visibility: str = "private"
    default_timezone: str | None = None
    enable_activity_feed: bool = True
    # Visibility & locale
    visibility: str = "private"
    locale: str | None = None
    # Module visibility
    enabled_modules: list[str] = Field(default_factory=lambda: list(ALL_MODULES))


class WorkspaceSettingsUpdate(BaseModel):
    default_project_visibility: str | None = None
    default_timezone: str | None = None
    enable_activity_feed: bool | None = None
    # Visibility & locale
    visibility: str | None = None
    locale: str | None = None
    # Module visibility
    enabled_modules: list[str] | None = None
