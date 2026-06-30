from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.ai_context import AIContextMetadataRead
from app.schemas.configuration import ConfigurationMetadataRead


class ContextVersionRead(BaseModel):
    user_id: int
    organization_id: int | None = None
    organization_version: int
    workspace_id: int | None = None
    workspace_version: int
    project_id: int | None = None
    project_version: int
    access_version: int
    generated_at: datetime


class UserContextRead(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    job_title: str | None = None
    is_superuser: bool
    is_active: bool


class RoleContextRead(BaseModel):
    id: int
    name: str
    key: str
    scope: str
    source_scope_type: str
    source_scope_id: int | None = None


class OrgContextRead(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    description: str | None = None
    settings: dict[str, Any] | None = None


class WorkspaceContextRead(BaseModel):
    id: int
    name: str
    slug: str
    organization_id: int
    is_active: bool
    description: str | None = None


class ProjectContextRead(BaseModel):
    id: int
    name: str
    key: str
    workspace_id: int
    status: str
    is_active: bool
    description: str | None = None


class ModuleContextRead(BaseModel):
    module_key: str
    name: str
    description: str | None = None
    category: str
    route: str
    icon: str
    navigation_mode: str
    required_feature_flag: str | None = None
    required_permissions: list[str]
    sort_order: int
    enabled: bool
    visible: bool


class PlatformContextResponse(BaseModel):
    user: UserContextRead
    permissions: list[str]
    roles: list[RoleContextRead]
    organizations: list[OrgContextRead]
    current_org: OrgContextRead | None = None
    workspaces: list[WorkspaceContextRead]
    current_workspace: WorkspaceContextRead | None = None
    projects: list[ProjectContextRead]
    current_project: ProjectContextRead | None = None
    context_version: int
    generated_at: datetime
    feature_flags: dict[str, bool]
    enabled_modules: list[str]
    modules: list[ModuleContextRead]
    ai_context: AIContextMetadataRead
    configuration: ConfigurationMetadataRead
    preferences: dict[str, Any]
