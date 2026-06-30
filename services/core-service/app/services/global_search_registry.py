from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.module_registry import ModuleRegistry
from app.models.organization import Organization
from app.models.project import Project
from app.models.role import Role
from app.models.team import Team
from app.models.user import User
from app.models.workspace import Workspace
from app.services.access_control_service import AccessControlService
from app.services.module_registry import ModuleRegistryService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.team_service import TeamService
from app.services.workspace_service import WorkspaceService


@dataclass(frozen=True)
class SearchableEntityDefinition:
    entity_type: str
    source_module: str
    display_name: str
    description: str
    category: str
    route_template: str
    icon: str
    requires_feature_flag: str | None
    requires_permissions: tuple[str, ...]
    sort_order: int
    is_active: bool = True


DEFAULT_SEARCHABLE_ENTITIES: tuple[SearchableEntityDefinition, ...] = (
    SearchableEntityDefinition(
        "core.organization",
        "core",
        "Organization",
        "Organizations available to the user.",
        "core",
        "/settings/organizations/{id}",
        "building",
        None,
        ("settings.organization.view",),
        100,
    ),
    SearchableEntityDefinition(
        "core.workspace",
        "core",
        "Workspace",
        "Workspaces available to the user.",
        "core",
        "/settings/workspaces/{id}",
        "layers",
        None,
        ("settings.workspace.view",),
        110,
    ),
    SearchableEntityDefinition(
        "core.project",
        "core",
        "Project",
        "Projects available to the user.",
        "core",
        "/settings/projects/{id}",
        "folder",
        None,
        ("settings.project.view",),
        120,
    ),
    SearchableEntityDefinition(
        "core.team",
        "core",
        "Team",
        "Teams available to the user.",
        "people",
        "/settings/teams/{id}",
        "users",
        None,
        ("settings.team.view",),
        130,
    ),
    SearchableEntityDefinition(
        "core.member",
        "core",
        "Member",
        "Members visible to the user.",
        "people",
        "/settings/members/{id}",
        "user",
        None,
        ("settings.member.view",),
        140,
    ),
    SearchableEntityDefinition(
        "core.role",
        "core",
        "Role",
        "Roles and permission bundles.",
        "settings",
        "/settings/access-control",
        "shield",
        None,
        ("settings.role.view", "settings.access_control.view"),
        150,
    ),
    SearchableEntityDefinition(
        "core.module",
        "core",
        "Module",
        "Available Asthra modules.",
        "system",
        "{route}",
        "grid",
        None,
        (),
        160,
    ),
    SearchableEntityDefinition(
        "core.setting",
        "core",
        "Setting",
        "Core settings destinations.",
        "settings",
        "{route}",
        "settings",
        None,
        (),
        170,
    ),
)


DEFAULT_SEARCH_SETTINGS: tuple[dict, ...] = (
    {
        "key": "settings.organizations",
        "title": "Organizations",
        "description": "Create and manage organizations.",
        "route": "/settings/organizations",
        "permission": "settings.organization.view",
    },
    {
        "key": "settings.workspaces",
        "title": "Workspaces",
        "description": "Create and manage workspaces.",
        "route": "/settings/workspaces",
        "permission": "settings.workspace.view",
    },
    {
        "key": "settings.projects",
        "title": "Projects",
        "description": "Create and manage projects.",
        "route": "/settings/projects",
        "permission": "settings.project.view",
    },
    {
        "key": "settings.members",
        "title": "Members",
        "description": "Manage members, invitations, and role assignments.",
        "route": "/settings/members",
        "permission": "settings.member.view",
    },
    {
        "key": "settings.access_control",
        "title": "Access Control",
        "description": "Review roles, permissions, mappings, and assignments.",
        "route": "/settings/access-control",
        "permission": "settings.access_control.view",
    },
)


class GlobalSearchRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_search_registry(self) -> list[dict]:
        return [
            self._definition_payload(definition)
            for definition in sorted(DEFAULT_SEARCHABLE_ENTITIES, key=lambda item: item.sort_order)
            if definition.is_active
        ]

    def get_search_metadata(self) -> dict:
        registry = self.get_search_registry()
        return {
            "available": True,
            "endpoint": "/api/v1/search",
            "registry_endpoint": "/api/v1/search/registry",
            "categories": sorted({item["category"] for item in registry}),
            "entity_types": [item["entity_type"] for item in registry],
            "shortcut": "CMD+K",
        }

    def search_global(
        self,
        user: User,
        *,
        query: str,
        limit: int = 20,
        categories: list[str] | None = None,
        entity_types: list[str] | None = None,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
    ) -> dict:
        normalized_query = query.strip()
        normalized_limit = max(1, min(limit, 50))
        if not normalized_query:
            return {
                "query": normalized_query,
                "limit": normalized_limit,
                "generated_at": datetime.now(timezone.utc),
                "results": [],
            }

        category_filter = {value.strip() for value in categories or [] if value.strip()}
        type_filter = {value.strip() for value in entity_types or [] if value.strip()}
        context_scope = self._scope_from_ids(organization_id, workspace_id, project_id)
        results: list[dict] = []
        for definition in sorted(DEFAULT_SEARCHABLE_ENTITIES, key=lambda item: item.sort_order):
            if not definition.is_active:
                continue
            if category_filter and definition.category not in category_filter:
                continue
            if type_filter and definition.entity_type not in type_filter:
                continue
            if not self._definition_allowed(definition, user, context_scope):
                continue
            provider = getattr(self, f"_search_{definition.entity_type.replace('.', '_')}", None)
            if provider is None:
                continue
            results.extend(
                provider(
                    definition,
                    user,
                    normalized_query,
                    normalized_limit,
                    organization_id=organization_id,
                    workspace_id=workspace_id,
                    project_id=project_id,
                )
            )

        deduped = {result["id"]: result for result in results}
        sorted_results = sorted(
            deduped.values(),
            key=lambda result: (-result["score"], result["category"], result["title"].lower(), result["id"]),
        )[:normalized_limit]
        return {
            "query": normalized_query,
            "limit": normalized_limit,
            "generated_at": datetime.now(timezone.utc),
            "results": sorted_results,
        }

    def _search_core_organization(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        organizations = OrganizationService(self.db).list(user, status_filter="all")
        matched = [org for org in organizations if self._matches(query, org.name, org.slug, org.description)]
        return [
            self._result(
                definition,
                row_id=org.id,
                title=org.name,
                subtitle="Organization",
                description=org.description,
                route=f"/settings/organizations/{org.id}",
                scope={"organization_id": org.id, "workspace_id": None, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": org.name, "slug": org.slug, "description": org.description}),
                metadata={"slug": org.slug, "active": org.is_active},
                score=self._score(query, org.name, org.slug),
            )
            for org in matched[:limit]
        ]

    def _search_core_workspace(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        *,
        organization_id: int | None = None,
        **_: object,
    ) -> list[dict]:
        workspaces = WorkspaceService(self.db).list(user, organization_id=organization_id, include_inactive=True)
        matched = [workspace for workspace in workspaces if self._matches(query, workspace.name, workspace.slug, workspace.description)]
        return [
            self._result(
                definition,
                row_id=workspace.id,
                title=workspace.name,
                subtitle="Workspace",
                description=workspace.description,
                route=f"/settings/workspaces/{workspace.id}",
                scope={"organization_id": workspace.organization_id, "workspace_id": workspace.id, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": workspace.name, "slug": workspace.slug, "description": workspace.description}),
                metadata={"slug": workspace.slug, "active": workspace.is_active},
                score=self._score(query, workspace.name, workspace.slug),
            )
            for workspace in matched[:limit]
        ]

    def _search_core_project(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        *,
        workspace_id: int | None = None,
        **_: object,
    ) -> list[dict]:
        projects = ProjectService(self.db).list(user, workspace_id=workspace_id, include_inactive=True)
        matched = [project for project in projects if self._matches(query, project.name, project.key, project.description)]
        return [
            self._result(
                definition,
                row_id=project.id,
                title=project.name,
                subtitle="Project",
                description=project.description,
                route=f"/settings/projects/{project.id}",
                scope={"organization_id": project.workspace.organization_id, "workspace_id": project.workspace_id, "project_id": project.id},
                matched_fields=self._matched_fields(query, {"name": project.name, "key": project.key, "description": project.description}),
                metadata={"key": project.key, "status": project.status, "active": project.is_active},
                score=self._score(query, project.name, project.key),
            )
            for project in matched[:limit]
        ]

    def _search_core_team(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        teams = TeamService(self.db).list(user)
        matched = [team for team in teams if self._matches(query, team.name, team.slug, team.description)]
        return [
            self._result(
                definition,
                row_id=team.id,
                title=team.name,
                subtitle="Team",
                description=team.description,
                route=f"/settings/teams/{team.id}",
                scope={"organization_id": team.workspace.organization_id, "workspace_id": team.workspace_id, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": team.name, "slug": team.slug, "description": team.description}),
                metadata={"slug": team.slug, "active": team.is_active},
                score=self._score(query, team.name, team.slug),
            )
            for team in matched[:limit]
        ]

    def _search_core_member(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        access = AccessControlService(self.db)
        if not access.can(user.id, "settings.member.view", "platform", None):
            return []
        pattern = f"%{query.lower()}%"
        members = (
            self.db.query(User)
            .filter(
                User.is_active.is_(True),
                or_(
                    User.email.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.job_title.ilike(pattern),
                ),
            )
            .order_by(User.full_name, User.email)
            .limit(limit)
            .all()
        )
        return [
            self._result(
                definition,
                row_id=member.id,
                title=member.full_name or member.email,
                subtitle="Member",
                description=member.email,
                route=f"/settings/members/{member.id}",
                scope={"organization_id": None, "workspace_id": None, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": member.full_name, "email": member.email, "job_title": member.job_title}),
                metadata={"email": member.email, "job_title": member.job_title},
                score=self._score(query, member.full_name, member.email),
            )
            for member in members
        ]

    def _search_core_role(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        access = AccessControlService(self.db)
        if not (
            access.can(user.id, "settings.role.view", "platform", None)
            or access.can(user.id, "settings.access_control.view", "platform", None)
        ):
            return []
        pattern = f"%{query.lower()}%"
        roles = (
            self.db.query(Role)
            .filter(
                Role.is_active.is_(True),
                Role.is_hidden.is_(False),
                or_(Role.name.ilike(pattern), Role.key.ilike(pattern), Role.description.ilike(pattern)),
            )
            .order_by(Role.scope, Role.name)
            .limit(limit)
            .all()
        )
        return [
            self._result(
                definition,
                row_id=role.id,
                title=role.name,
                subtitle="Role",
                description=role.description,
                route="/settings/access-control",
                scope={"organization_id": role.organization_id, "workspace_id": None, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": role.name, "key": role.key, "description": role.description}),
                metadata={"key": role.key, "scope": role.scope},
                score=self._score(query, role.name, role.key),
            )
            for role in roles
        ]

    def _search_core_module(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        modules: list[dict] = []
        registry = ModuleRegistryService(self.db)
        for mode in ("platform", "org", "work"):
            modules.extend(registry.resolve_modules_for_context(user, scope_type="platform", scope_id=None, navigation_mode=mode))
        matched = [module for module in modules if self._matches(query, module["name"], module["module_key"], module["description"])]
        return [
            self._result(
                definition,
                row_id=module["module_key"],
                title=module["name"],
                subtitle="Module",
                description=module["description"],
                route=module["route"],
                scope={"organization_id": None, "workspace_id": None, "project_id": None},
                matched_fields=self._matched_fields(query, {"name": module["name"], "key": module["module_key"], "description": module["description"]}),
                metadata={"module_key": module["module_key"], "navigation_mode": module["navigation_mode"]},
                score=self._score(query, module["name"], module["module_key"]),
            )
            for module in matched[:limit]
        ]

    def _search_core_setting(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        query: str,
        limit: int,
        **_: object,
    ) -> list[dict]:
        access = AccessControlService(self.db)
        matched = [
            item for item in DEFAULT_SEARCH_SETTINGS
            if self._matches(query, item["title"], item["description"], item["key"])
            and access.can(user.id, item["permission"], "platform", None)
        ]
        return [
            self._result(
                definition,
                row_id=item["key"],
                title=item["title"],
                subtitle="Setting",
                description=item["description"],
                route=item["route"],
                scope={"organization_id": None, "workspace_id": None, "project_id": None},
                matched_fields=self._matched_fields(query, {"title": item["title"], "description": item["description"], "key": item["key"]}),
                metadata={"setting_key": item["key"]},
                score=self._score(query, item["title"], item["key"]),
            )
            for item in matched[:limit]
        ]

    def _definition_allowed(
        self,
        definition: SearchableEntityDefinition,
        user: User,
        context_scope: tuple[str, int | None],
    ) -> bool:
        if user.is_superuser:
            return True
        if not definition.requires_permissions:
            return True
        access = AccessControlService(self.db)
        scope_type, scope_id = context_scope
        return any(access.can(user.id, permission, scope_type, scope_id) for permission in definition.requires_permissions)

    def _definition_payload(self, definition: SearchableEntityDefinition) -> dict:
        return {
            "entity_type": definition.entity_type,
            "source_module": definition.source_module,
            "display_name": definition.display_name,
            "description": definition.description,
            "category": definition.category,
            "route_template": definition.route_template,
            "icon": definition.icon,
            "requires_feature_flag": definition.requires_feature_flag,
            "requires_permissions": list(definition.requires_permissions),
            "is_active": definition.is_active,
            "sort_order": definition.sort_order,
        }

    def _result(
        self,
        definition: SearchableEntityDefinition,
        *,
        row_id: int | str,
        title: str,
        subtitle: str,
        description: str | None,
        route: str,
        scope: dict,
        matched_fields: list[str],
        metadata: dict,
        score: int,
    ) -> dict:
        return {
            "id": f"{definition.entity_type}:{row_id}",
            "entity_type": definition.entity_type,
            "source_module": definition.source_module,
            "title": title,
            "subtitle": subtitle,
            "description": description,
            "route": route,
            "icon": definition.icon,
            "category": definition.category,
            "scope": scope,
            "matched_fields": matched_fields,
            "score": score,
            "metadata": {key: value for key, value in metadata.items() if value is not None},
        }

    def _scope_from_ids(
        self,
        organization_id: int | None,
        workspace_id: int | None,
        project_id: int | None,
    ) -> tuple[str, int | None]:
        if project_id is not None:
            return "project", project_id
        if workspace_id is not None:
            return "workspace", workspace_id
        if organization_id is not None:
            return "organization", organization_id
        return "platform", None

    def _matches(self, query: str, *values: str | None) -> bool:
        normalized = query.lower()
        return any(normalized in (value or "").lower() for value in values)

    def _matched_fields(self, query: str, fields: dict[str, str | None]) -> list[str]:
        normalized = query.lower()
        return [name for name, value in fields.items() if normalized in (value or "").lower()]

    def _score(self, query: str, *values: str | None) -> int:
        normalized = query.lower()
        for value in values:
            candidate = (value or "").lower()
            if candidate == normalized:
                return 100
            if candidate.startswith(normalized):
                return 80
        return 50
