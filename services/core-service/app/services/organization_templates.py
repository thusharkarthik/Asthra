from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.project import Project
from app.models.team import Team
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.organization_template import (
    OrganizationTemplateActionRead,
    OrganizationTemplateRead,
    OrganizationTemplateReportRead,
    OrganizationTemplateSummaryRead,
)
from app.schemas.project import ProjectCreate
from app.schemas.team import TeamCreate
from app.schemas.workspace import WorkspaceCreate
from app.services.access_control_service import AccessControlService
from app.services.activity_service import ActivityService
from app.services.configuration_registry import ConfigurationRegistryService
from app.services.feature_flags import FeatureFlagService
from app.services.project_service import ProjectService
from app.services.team_service import TeamService
from app.services.workspace_service import WorkspaceService


@dataclass(frozen=True)
class TemplateProject:
    name: str
    description: str


@dataclass(frozen=True)
class TemplateTeam:
    name: str
    description: str


@dataclass(frozen=True)
class TemplateWorkspace:
    name: str
    description: str
    projects: tuple[TemplateProject, ...] = ()
    teams: tuple[TemplateTeam, ...] = ()


@dataclass(frozen=True)
class OrganizationTemplateDefinition:
    template_key: str
    name: str
    description: str
    category: str
    recommended_for: tuple[str, ...]
    workspaces: tuple[TemplateWorkspace, ...]
    feature_flags: dict[str, bool] = field(default_factory=dict)
    configuration: dict[str, Any] = field(default_factory=dict)
    notes: tuple[str, ...] = ()
    sort_order: int = 100
    is_active: bool = True


TEMPLATE_CATALOG: tuple[OrganizationTemplateDefinition, ...] = (
    OrganizationTemplateDefinition(
        template_key="startup",
        name="Startup",
        description="Create a compact startup setup for product discovery, delivery, and operating cadence.",
        category="startup",
        recommended_for=("founders", "early-stage teams", "SaaS startups"),
        workspaces=(
            TemplateWorkspace(
                name="Product",
                description="Product discovery and roadmap workspace.",
                projects=(
                    TemplateProject("MVP", "Initial product validation and launch project."),
                    TemplateProject("Website", "Marketing site and acquisition project."),
                ),
            ),
            TemplateWorkspace(
                name="Engineering",
                description="Engineering execution workspace.",
                projects=(TemplateProject("Platform", "Core platform engineering project."),),
                teams=(
                    TemplateTeam("Backend", "Backend engineering team."),
                    TemplateTeam("Frontend", "Frontend engineering team."),
                ),
            ),
            TemplateWorkspace(name="Operations", description="Company operations workspace."),
        ),
        feature_flags={
            "module.flow.enabled": True,
            "module.discover.enabled": True,
            "module.docs.enabled": True,
            "module.memory.enabled": True,
            "module.assistant.enabled": True,
        },
        configuration={
            "flow.default_sprint_length_days": 14,
            "flow.enable_backlog": True,
            "docs.default_space_visibility": "workspace",
            "assistant.enable_contextual_guidance": True,
        },
        notes=("Use Discover for opportunity intake before creating delivery work.",),
        sort_order=10,
    ),
    OrganizationTemplateDefinition(
        template_key="software_team",
        name="Software Team",
        description="Set up a software delivery organization with engineering workspaces, projects, and execution modules.",
        category="software",
        recommended_for=("product teams", "engineering teams", "SaaS startups"),
        workspaces=(
            TemplateWorkspace(
                name="Engineering",
                description="Software engineering delivery workspace.",
                projects=(
                    TemplateProject("Platform", "Core platform engineering project."),
                    TemplateProject("Frontend", "Frontend application project."),
                    TemplateProject("Backend", "Backend services project."),
                    TemplateProject("Mobile", "Mobile application project."),
                ),
                teams=(
                    TemplateTeam("Backend", "Backend engineering team."),
                    TemplateTeam("Frontend", "Frontend engineering team."),
                    TemplateTeam("QA", "Quality assurance team."),
                ),
            ),
            TemplateWorkspace(
                name="Product",
                description="Product planning and discovery workspace.",
                projects=(TemplateProject("Roadmap", "Product roadmap planning project."),),
            ),
        ),
        feature_flags={
            "module.flow.enabled": True,
            "module.docs.enabled": True,
            "module.discover.enabled": True,
            "module.insights.enabled": True,
            "module.memory.enabled": True,
            "module.assistant.enabled": True,
        },
        configuration={
            "flow.default_sprint_length_days": 14,
            "flow.enable_backlog": True,
            "flow.enable_releases": True,
            "docs.default_space_visibility": "workspace",
        },
        notes=("No Flow work items or Docs pages are created by this v1 template.",),
        sort_order=20,
    ),
    OrganizationTemplateDefinition(
        template_key="healthcare",
        name="Healthcare",
        description="Create workspaces for healthcare operations, compliance, and platform delivery.",
        category="healthcare",
        recommended_for=("healthcare operations", "compliance teams", "digital health teams"),
        workspaces=(
            TemplateWorkspace(
                name="Operations",
                description="Healthcare operations workspace.",
                projects=(TemplateProject("Patient Experience", "Patient-facing process and experience improvements."),),
                teams=(TemplateTeam("Support", "Operational support team."),),
            ),
            TemplateWorkspace(
                name="Compliance",
                description="Compliance readiness workspace.",
                projects=(TemplateProject("Compliance Readiness", "Compliance controls and readiness project."),),
                teams=(TemplateTeam("Compliance", "Compliance and governance team."),),
            ),
            TemplateWorkspace(
                name="Product",
                description="Healthcare product delivery workspace.",
                projects=(TemplateProject("Platform Operations", "Platform operations and delivery project."),),
                teams=(TemplateTeam("Engineering", "Healthcare platform engineering team."),),
            ),
        ),
        feature_flags={
            "module.docs.enabled": True,
            "module.desk.enabled": True,
            "module.pulse.enabled": True,
            "module.flow.enabled": True,
        },
        configuration={
            "docs.require_page_approval": True,
            "desk.default_sla_hours": 8,
            "pulse.enable_incident_postmortems": True,
        },
        notes=("Governance modules are future-ready and are not created as records in v1.",),
        sort_order=30,
    ),
    OrganizationTemplateDefinition(
        template_key="support_desk",
        name="Support Desk",
        description="Prepare a service operations setup for support teams and incident readiness.",
        category="support",
        recommended_for=("support teams", "IT service desks", "customer operations"),
        workspaces=(
            TemplateWorkspace(
                name="Support",
                description="Customer and internal support workspace.",
                projects=(TemplateProject("Customer Support", "Customer ticket handling and support operations."),),
                teams=(
                    TemplateTeam("Support Agents", "Frontline support team."),
                    TemplateTeam("Escalation Team", "Escalation and specialist support team."),
                ),
            ),
            TemplateWorkspace(
                name="Operations",
                description="Support operations workspace.",
                projects=(TemplateProject("Internal IT", "Internal IT support and service operations."),),
            ),
        ),
        feature_flags={
            "module.desk.enabled": True,
            "module.docs.enabled": True,
            "module.pulse.enabled": True,
            "module.automation.enabled": True,
            "module.insights.enabled": True,
        },
        configuration={
            "desk.default_sla_hours": 4,
            "desk.enable_auto_assignment": True,
            "pulse.enable_incident_postmortems": True,
        },
        sort_order=40,
    ),
    OrganizationTemplateDefinition(
        template_key="agency",
        name="Agency",
        description="Set up client delivery, creative operations, and business operations workspaces.",
        category="agency",
        recommended_for=("agencies", "consultancies", "client delivery teams"),
        workspaces=(
            TemplateWorkspace(
                name="Client Delivery",
                description="Client project delivery workspace.",
                projects=(
                    TemplateProject("Client Onboarding", "New client onboarding process."),
                    TemplateProject("Campaign Delivery", "Campaign planning and delivery project."),
                ),
            ),
            TemplateWorkspace(name="Creative", description="Creative production workspace."),
            TemplateWorkspace(name="Operations", description="Agency operations workspace."),
        ),
        feature_flags={
            "module.flow.enabled": True,
            "module.docs.enabled": True,
            "module.discover.enabled": True,
            "module.insights.enabled": True,
        },
        configuration={
            "flow.default_sprint_length_days": 7,
            "docs.default_space_visibility": "workspace",
        },
        sort_order=50,
    ),
    OrganizationTemplateDefinition(
        template_key="enterprise_it",
        name="Enterprise IT",
        description="Prepare IT operations, security, infrastructure, and access management workspaces.",
        category="enterprise_it",
        recommended_for=("enterprise IT", "platform operations", "infrastructure teams"),
        workspaces=(
            TemplateWorkspace(
                name="IT Operations",
                description="IT service and operations workspace.",
                projects=(TemplateProject("Service Desk", "Enterprise service desk operations."),),
            ),
            TemplateWorkspace(
                name="Security",
                description="Security and access governance workspace.",
                projects=(TemplateProject("Access Management", "Identity and access management project."),),
            ),
            TemplateWorkspace(
                name="Infrastructure",
                description="Infrastructure operations workspace.",
                projects=(TemplateProject("Infrastructure Operations", "Infrastructure reliability and operations."),),
            ),
        ),
        feature_flags={
            "module.desk.enabled": True,
            "module.pulse.enabled": True,
            "module.docs.enabled": True,
            "module.automation.enabled": True,
            "module.connect.enabled": True,
            "module.insights.enabled": True,
        },
        configuration={
            "desk.default_sla_hours": 4,
            "desk.enable_auto_assignment": True,
            "pulse.enable_incident_postmortems": True,
        },
        sort_order=60,
    ),
)


class OrganizationTemplateService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_template_catalog(self) -> dict[str, list[OrganizationTemplateRead]]:
        return {"templates": [self._template_to_read(template) for template in self._active_templates()]}

    def get_template_detail(self, template_key: str) -> OrganizationTemplateRead:
        return self._template_to_read(self._get_template(template_key))

    def get_template_metadata(self) -> dict[str, Any]:
        templates = self._active_templates()
        return {
            "available": True,
            "endpoint": "/api/v1/organization-templates",
            "template_count": len(templates),
            "categories": sorted({template.category for template in templates}),
        }

    def preview_template_for_organization(
        self,
        organization_id: int,
        template_key: str,
        user: User,
    ) -> OrganizationTemplateReportRead:
        organization = self._get_organization(organization_id)
        self._require_template_permission(user, "settings.organization_templates.view", organization.id)
        template = self._get_template(template_key)
        return self._build_report(template, organization, mutate=False, user=user)

    def apply_template_to_organization(
        self,
        organization_id: int,
        template_key: str,
        user: User,
    ) -> OrganizationTemplateReportRead:
        organization = self._get_organization(organization_id)
        self._require_template_permission(user, "settings.organization_templates.apply", organization.id)
        template = self._get_template(template_key)
        report = self._build_report(template, organization, mutate=True, user=user)
        actor_name = user.full_name or user.email
        ActivityService(self.db).log_activity(
            actor_user_id=user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action="organization.template_applied",
            description=f"Organization template '{template.name}' was applied by {actor_name}.",
        )
        self.db.commit()
        return report

    def _build_report(
        self,
        template: OrganizationTemplateDefinition,
        organization: Organization,
        *,
        mutate: bool,
        user: User,
    ) -> OrganizationTemplateReportRead:
        actions: list[OrganizationTemplateActionRead] = []
        warnings: list[str] = []
        summary = OrganizationTemplateSummaryRead()

        for workspace_definition in template.workspaces:
            workspace = self._find_workspace(organization.id, workspace_definition.name)
            if workspace is None:
                summary.workspaces_to_create += 1
                actions.append(self._action("create_workspace", workspace_definition.name, "pending", "organization", organization.id))
                if mutate:
                    workspace = WorkspaceService(self.db).create(
                        WorkspaceCreate(
                            organization_id=organization.id,
                            name=workspace_definition.name,
                            description=workspace_definition.description,
                        ),
                        user,
                    )
                    actions[-1] = self._action("create_workspace", workspace.name, "created", "workspace", workspace.id)
            else:
                summary.skipped_existing += 1
                actions.append(self._action("create_workspace", workspace.name, "skipped_existing", "workspace", workspace.id))

            for project_definition in workspace_definition.projects:
                project = self._find_project(workspace.id, project_definition.name) if workspace is not None else None
                if project is None:
                    summary.projects_to_create += 1
                    actions.append(
                        self._action(
                            "create_project",
                            project_definition.name,
                            "pending",
                            "workspace",
                            workspace.id if workspace else None,
                            parent=workspace_definition.name,
                        )
                    )
                    if mutate and workspace is not None:
                        project = ProjectService(self.db).create(
                            ProjectCreate(
                                workspace_id=workspace.id,
                                name=project_definition.name,
                                description=project_definition.description,
                            ),
                            user,
                        )
                        actions[-1] = self._action(
                            "create_project",
                            project.name,
                            "created",
                            "project",
                            project.id,
                            parent=workspace.name,
                        )
                else:
                    summary.skipped_existing += 1
                    actions.append(
                        self._action(
                            "create_project",
                            project.name,
                            "skipped_existing",
                            "project",
                            project.id,
                            parent=workspace.name if workspace else workspace_definition.name,
                        )
                    )

            for team_definition in workspace_definition.teams:
                team = self._find_team(workspace.id, team_definition.name) if workspace is not None else None
                if team is None:
                    summary.teams_to_create += 1
                    actions.append(
                        self._action(
                            "create_team",
                            team_definition.name,
                            "pending",
                            "workspace",
                            workspace.id if workspace else None,
                            parent=workspace_definition.name,
                        )
                    )
                    if mutate and workspace is not None:
                        team = TeamService(self.db).create(
                            TeamCreate(
                                workspace_id=workspace.id,
                                name=team_definition.name,
                                description=team_definition.description,
                            ),
                            user,
                        )
                        actions[-1] = self._action(
                            "create_team",
                            team.name,
                            "created",
                            "team",
                            team.id,
                            parent=workspace.name,
                        )
                else:
                    summary.skipped_existing += 1
                    actions.append(
                        self._action(
                            "create_team",
                            team.name,
                            "skipped_existing",
                            "team",
                            team.id,
                            parent=workspace.name if workspace else workspace_definition.name,
                        )
                    )

        for flag_key, enabled in template.feature_flags.items():
            summary.feature_flags_to_apply += 1
            status_text = "pending"
            if mutate:
                try:
                    FeatureFlagService(self.db).set_feature_flag_override(
                        flag_key=flag_key,
                        scope_type="organization",
                        scope_id=organization.id,
                        enabled=enabled,
                        actor=user,
                        reason=f"Applied organization template: {template.name}",
                    )
                    status_text = "applied"
                except HTTPException as exc:
                    status_text = "skipped"
                    warnings.append(f"Feature flag '{flag_key}' was not applied: {exc.detail}")
            actions.append(
                self._action(
                    "apply_feature_flag",
                    flag_key,
                    status_text,
                    "organization",
                    organization.id,
                    detail=f"enabled={enabled}",
                )
            )

        for config_key, value in template.configuration.items():
            summary.configuration_values_to_apply += 1
            status_text = "pending"
            if mutate:
                try:
                    ConfigurationRegistryService(self.db).set_configuration_value(
                        config_key=config_key,
                        scope_type="organization",
                        scope_id=organization.id,
                        value=value,
                        actor=user,
                        reason=f"Applied organization template: {template.name}",
                    )
                    status_text = "applied"
                except HTTPException as exc:
                    status_text = "skipped"
                    warnings.append(f"Configuration value '{config_key}' was not applied: {exc.detail}")
            actions.append(
                self._action(
                    "apply_configuration",
                    config_key,
                    status_text,
                    "organization",
                    organization.id,
                    detail=f"value={value}",
                )
            )

        return OrganizationTemplateReportRead(
            template_key=template.template_key,
            organization_id=organization.id,
            summary=summary,
            actions=actions,
            warnings=warnings,
        )

    def _require_template_permission(self, user: User, permission_code: str, organization_id: int) -> None:
        AccessControlService(self.db).require(user, permission_code, "organization", organization_id)

    def _get_organization(self, organization_id: int) -> Organization:
        organization = self.db.get(Organization, organization_id)
        if organization is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        return organization

    def _get_template(self, template_key: str) -> OrganizationTemplateDefinition:
        for template in self._active_templates():
            if template.template_key == template_key:
                return template
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization template not found.")

    def _active_templates(self) -> list[OrganizationTemplateDefinition]:
        return sorted((template for template in TEMPLATE_CATALOG if template.is_active), key=lambda template: template.sort_order)

    def _find_workspace(self, organization_id: int, name: str) -> Workspace | None:
        return (
            self.db.query(Workspace)
            .filter(
                Workspace.organization_id == organization_id,
                func.lower(Workspace.name) == name.strip().lower(),
            )
            .first()
        )

    def _find_project(self, workspace_id: int, name: str) -> Project | None:
        return (
            self.db.query(Project)
            .filter(Project.workspace_id == workspace_id, func.lower(Project.name) == name.strip().lower())
            .first()
        )

    def _find_team(self, workspace_id: int, name: str) -> Team | None:
        return (
            self.db.query(Team)
            .filter(Team.workspace_id == workspace_id, func.lower(Team.name) == name.strip().lower())
            .first()
        )

    def _template_to_read(self, template: OrganizationTemplateDefinition) -> OrganizationTemplateRead:
        return OrganizationTemplateRead(
            template_key=template.template_key,
            name=template.name,
            description=template.description,
            category=template.category,
            recommended_for=list(template.recommended_for),
            workspaces=[
                {
                    "name": workspace.name,
                    "description": workspace.description,
                    "projects": [
                        {"name": project.name, "description": project.description}
                        for project in workspace.projects
                    ],
                    "teams": [{"name": team.name, "description": team.description} for team in workspace.teams],
                }
                for workspace in template.workspaces
            ],
            feature_flags=template.feature_flags,
            configuration=template.configuration,
            notes=list(template.notes),
            sort_order=template.sort_order,
            is_active=template.is_active,
        )

    def _action(
        self,
        action_type: str,
        name: str,
        status_text: str,
        scope_type: str | None = None,
        scope_id: int | None = None,
        *,
        parent: str | None = None,
        detail: str | None = None,
    ) -> OrganizationTemplateActionRead:
        return OrganizationTemplateActionRead(
            action_type=action_type,
            name=name,
            status=status_text,
            scope_type=scope_type,
            scope_id=scope_id,
            parent=parent,
            detail=detail,
        )
