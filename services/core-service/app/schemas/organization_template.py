from typing import Any

from pydantic import BaseModel, Field


class OrganizationTemplateProjectRead(BaseModel):
    name: str
    description: str | None = None


class OrganizationTemplateTeamRead(BaseModel):
    name: str
    description: str | None = None


class OrganizationTemplateWorkspaceRead(BaseModel):
    name: str
    description: str | None = None
    projects: list[OrganizationTemplateProjectRead]
    teams: list[OrganizationTemplateTeamRead]


class OrganizationTemplateRead(BaseModel):
    template_key: str
    name: str
    description: str
    category: str
    recommended_for: list[str]
    workspaces: list[OrganizationTemplateWorkspaceRead]
    feature_flags: dict[str, bool]
    configuration: dict[str, Any]
    notes: list[str]
    sort_order: int
    is_active: bool


class OrganizationTemplateCatalogRead(BaseModel):
    templates: list[OrganizationTemplateRead]


class OrganizationTemplateRequest(BaseModel):
    organization_id: int = Field(gt=0)
    options: dict[str, Any] = Field(default_factory=dict)


class OrganizationTemplateActionRead(BaseModel):
    action_type: str
    name: str
    status: str
    scope_type: str | None = None
    scope_id: int | None = None
    parent: str | None = None
    detail: str | None = None


class OrganizationTemplateSummaryRead(BaseModel):
    workspaces_to_create: int = 0
    projects_to_create: int = 0
    teams_to_create: int = 0
    feature_flags_to_apply: int = 0
    configuration_values_to_apply: int = 0
    skipped_existing: int = 0


class OrganizationTemplateReportRead(BaseModel):
    template_key: str
    organization_id: int
    summary: OrganizationTemplateSummaryRead
    actions: list[OrganizationTemplateActionRead]
    warnings: list[str]


class OrganizationTemplateMetadataRead(BaseModel):
    available: bool
    endpoint: str
    template_count: int
    categories: list[str]
