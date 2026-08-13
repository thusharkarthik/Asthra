from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import RoleAssignment, User
from app.models.workspace import Workspace
from app.services.access_control_service import AccessControlService
from app.services.module_registry import ModuleRegistryService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.workspace_service import WorkspaceService


@dataclass(frozen=True)
class AIContextBlockDefinition:
    key: str
    title: str
    description: str
    source_module: str
    category: str
    priority: int
    requires_feature_flag: str | None = None
    requires_permissions: tuple[str, ...] = ()


DEFAULT_AI_CONTEXT_BLOCKS: tuple[AIContextBlockDefinition, ...] = (
    AIContextBlockDefinition(
        "core.user_context",
        "User Context",
        "Current authenticated user identity and account context.",
        "core",
        "identity",
        100,
    ),
    AIContextBlockDefinition(
        "core.scope_context",
        "Scope Context",
        "Current organization, workspace, and project context.",
        "core",
        "scope",
        200,
    ),
    AIContextBlockDefinition(
        "core.access_context",
        "Access Context",
        "Current roles, permission counts, and access constraints.",
        "core",
        "access",
        300,
    ),
    AIContextBlockDefinition(
        "core.feature_flag_context",
        "Feature Flag Context",
        "Effective feature flags and enabled modules for the current scope.",
        "core",
        "feature_flags",
        400,
    ),
    AIContextBlockDefinition(
        "core.module_context",
        "Module Context",
        "Available Asthra modules and navigation metadata.",
        "core",
        "navigation",
        500,
    ),
    AIContextBlockDefinition(
        "core.notification_context",
        "Notification Context",
        "Compact notification counts and recent notification metadata for the current user.",
        "core",
        "notifications",
        600,
    ),
    AIContextBlockDefinition(
        "core.recent_activity_context",
        "Recent Activity Context",
        "Compact activity summary for the current user and selected scope.",
        "core",
        "activity",
        700,
    ),
    AIContextBlockDefinition(
        "core.onboarding_context",
        "Onboarding Context",
        "Current onboarding state derived from organization membership and platform role status.",
        "core",
        "onboarding",
        800,
    ),
)


class AIContextRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_ai_context_registry(self) -> list[dict]:
        return [self._metadata(block) for block in sorted(DEFAULT_AI_CONTEXT_BLOCKS, key=lambda item: item.priority)]

    def get_ai_context_metadata(
        self,
        user: User,
        *,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
        categories: list[str] | None = None,
    ) -> dict:
        blocks = self.resolve_context_blocks(
            user,
            organization_id=organization_id,
            workspace_id=workspace_id,
            project_id=project_id,
            categories=categories,
            include_data=False,
        )
        return {
            "available": True,
            "endpoint": "/api/v1/ai/context",
            "block_count": len(blocks),
            "categories": sorted({block["category"] for block in blocks}),
            "source_modules": sorted({block["source_module"] for block in blocks}),
        }

    def resolve_ai_context_for_user(
        self,
        user: User,
        *,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
        categories: list[str] | None = None,
        include_data: bool = True,
    ) -> dict:
        generated_at = datetime.now(timezone.utc)
        scope_type, scope_id = self._scope_from_ids(organization_id, workspace_id, project_id)
        blocks = self.resolve_context_blocks(
            user,
            organization_id=organization_id,
            workspace_id=workspace_id,
            project_id=project_id,
            categories=categories,
            include_data=include_data,
            generated_at=generated_at,
        )
        return {
            "generated_at": generated_at,
            "scope": {
                "organization_id": organization_id,
                "workspace_id": workspace_id,
                "project_id": project_id,
                "scope_type": scope_type,
                "scope_id": scope_id,
            },
            "summary": {
                "block_count": len(blocks),
                "source_modules": sorted({block["source_module"] for block in blocks}),
                "categories": sorted({block["category"] for block in blocks}),
            },
            "context_blocks": blocks,
        }

    def resolve_context_blocks(
        self,
        user: User,
        *,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
        categories: list[str] | None = None,
        include_data: bool = True,
        generated_at: datetime | None = None,
    ) -> list[dict]:
        generated_at = generated_at or datetime.now(timezone.utc)
        requested_categories = {category.strip() for category in categories or [] if category.strip()}
        scope_type, scope_id = self._scope_from_ids(organization_id, workspace_id, project_id)
        permissions_payload = AccessControlService(self.db).get_user_permissions(user.id, scope_type, scope_id)
        permission_codes = set(permissions_payload.get("permission_codes", []))
        feature_flags = permissions_payload.get("feature_flags", {})
        navigation_mode = self._navigation_mode(organization_id, workspace_id, project_id)
        available_modules = ModuleRegistryService(self.db).resolve_modules_for_context(
            user,
            scope_type=scope_type,
            scope_id=scope_id,
            navigation_mode=navigation_mode,
        )
        shared = {
            "scope_type": scope_type,
            "scope_id": scope_id,
            "organization_id": organization_id,
            "workspace_id": workspace_id,
            "project_id": project_id,
            "permissions_payload": permissions_payload,
            "permission_codes": permission_codes,
            "feature_flags": feature_flags,
            "available_modules": available_modules,
            "navigation_mode": navigation_mode,
        }
        blocks: list[dict] = []
        for block in sorted(DEFAULT_AI_CONTEXT_BLOCKS, key=lambda item: item.priority):
            if requested_categories and block.category not in requested_categories:
                continue
            if not self._is_context_block_allowed(block, feature_flags, permission_codes, user):
                continue
            data = self._resolve_block_data(block.key, user, shared) if include_data else {}
            blocks.append(
                {
                    **self._metadata(block),
                    "scope_type": scope_type,
                    "scope_id": scope_id,
                    "data": data,
                    "metadata": {
                        "include_data": include_data,
                        "compact": True,
                    },
                    "generated_at": generated_at,
                }
            )
        return blocks

    def _is_context_block_allowed(
        self,
        block: AIContextBlockDefinition,
        feature_flags: dict[str, bool],
        permission_codes: set[str],
        user: User,
    ) -> bool:
        if block.requires_feature_flag and not feature_flags.get(block.requires_feature_flag, False):
            return False
        if block.requires_permissions and not user.is_superuser:
            return bool(permission_codes.intersection(block.requires_permissions))
        return True

    def _resolve_block_data(self, key: str, user: User, shared: dict) -> dict:
        if key == "core.user_context":
            return self._user_context(user)
        if key == "core.scope_context":
            return self._scope_context(user, shared)
        if key == "core.access_context":
            return self._access_context(shared)
        if key == "core.feature_flag_context":
            return self._feature_flag_context(shared)
        if key == "core.module_context":
            return self._module_context(shared)
        if key == "core.notification_context":
            return self._notification_context(user, shared)
        if key == "core.recent_activity_context":
            return self._recent_activity_context(user, shared)
        if key == "core.onboarding_context":
            return self._onboarding_context(user)
        return {}

    def _user_context(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "job_title": user.job_title,
            "timezone": user.timezone,
            "locale": user.locale,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
        }

    def _scope_context(self, user: User, shared: dict) -> dict:
        organization_id = shared["organization_id"]
        workspace_id = shared["workspace_id"]
        project_id = shared["project_id"]
        organizations = OrganizationService(self.db).list(user)
        workspaces = WorkspaceService(self.db).list(user, organization_id=organization_id)
        projects = ProjectService(self.db).list(user, workspace_id=workspace_id) if workspace_id else []
        return {
            "current_organization": self._organization_payload(next((org for org in organizations if org.id == organization_id), None)),
            "current_workspace": self._workspace_payload(next((workspace for workspace in workspaces if workspace.id == workspace_id), None)),
            "current_project": self._project_payload(next((project for project in projects if project.id == project_id), None)),
            "accessible_counts": {
                "organizations": len(organizations),
                "workspaces": len(workspaces),
                "projects": len(projects),
            },
        }

    def _access_context(self, shared: dict) -> dict:
        permissions_payload = shared["permissions_payload"]
        permission_codes = sorted(shared["permission_codes"])
        key_prefixes = ("settings.", "flow.", "docs.", "discover.", "desk.", "pulse.")
        key_permissions = [code for code in permission_codes if code.startswith(key_prefixes)][:25]
        return {
            "roles": permissions_payload.get("roles", []),
            "permission_count": len(permission_codes),
            "key_permissions": key_permissions,
            "scope": permissions_payload.get("scope", {}),
        }

    def _feature_flag_context(self, shared: dict) -> dict:
        feature_flags = shared["feature_flags"]
        disabled_major_modules = [
            flag_key.removeprefix("module.").removesuffix(".enabled")
            for flag_key, enabled in sorted(feature_flags.items())
            if flag_key.startswith("module.") and not enabled
        ]
        return {
            "enabled_modules": shared["permissions_payload"].get("enabled_modules", []),
            "enabled_flag_count": sum(1 for enabled in feature_flags.values() if enabled),
            "disabled_major_modules": disabled_major_modules,
        }

    def _module_context(self, shared: dict) -> dict:
        return {
            "navigation_mode": shared["navigation_mode"],
            "available_modules": [
                {
                    "module_key": module["module_key"],
                    "name": module["name"],
                    "route": module["route"],
                    "category": module["category"],
                    "navigation_mode": module["navigation_mode"],
                }
                for module in shared["available_modules"]
            ],
        }

    def _notification_context(self, user: User, shared: dict) -> dict:
        query = self.db.query(Notification).filter(Notification.user_id == user.id)
        query = self._apply_scope_filter(query, Notification, shared)
        unread_count = query.filter(Notification.is_read.is_(False)).count()
        recent = query.order_by(Notification.created_at.desc()).limit(5).all()
        return {
            "unread_count": unread_count,
            "recent": [
                {
                    "id": notification.id,
                    "type": notification.type,
                    "title": notification.title,
                    "is_read": notification.is_read,
                    "entity_type": notification.entity_type,
                    "created_at": notification.created_at.isoformat() if notification.created_at else None,
                }
                for notification in recent
            ],
        }

    def _recent_activity_context(self, user: User, shared: dict) -> dict:
        query = self.db.query(ActivityLog)
        if not user.is_superuser:
            query = query.filter(ActivityLog.actor_user_id == user.id)
        query = self._apply_scope_filter(query, ActivityLog, shared)
        recent = query.order_by(ActivityLog.created_at.desc()).limit(5).all()
        return {
            "recent": [
                {
                    "id": activity.id,
                    "action": activity.action,
                    "entity_type": activity.entity_type,
                    "entity_id": activity.entity_id,
                    "description": activity.description,
                    "created_at": activity.created_at.isoformat() if activity.created_at else None,
                }
                for activity in recent
            ],
        }

    def _onboarding_context(self, user: User) -> dict:
        organization_count = (
            self.db.query(func.count(Organization.id))
            .join(Organization.members)
            .filter_by(user_id=user.id)
            .scalar()
            or 0
        )
        active_assignments = (
            self.db.query(func.count(RoleAssignment.id))
            .filter(RoleAssignment.user_id == user.id, RoleAssignment.status == "active")
            .scalar()
            or 0
        )
        return {
            "needs_organization_onboarding": bool(organization_count == 0 and not user.is_superuser),
            "organization_membership_count": organization_count,
            "active_role_assignment_count": active_assignments,
            "skipped_onboarding_tracked": False,
        }

    def _apply_scope_filter(self, query, model, shared: dict):
        if shared["project_id"] is not None:
            return query.filter(model.project_id == shared["project_id"])
        if shared["workspace_id"] is not None:
            return query.filter(model.workspace_id == shared["workspace_id"])
        if shared["organization_id"] is not None:
            return query.filter(model.organization_id == shared["organization_id"])
        return query

    def _metadata(self, block: AIContextBlockDefinition) -> dict:
        return {
            "key": block.key,
            "title": block.title,
            "description": block.description,
            "source_module": block.source_module,
            "category": block.category,
            "priority": block.priority,
            "requires_feature_flag": block.requires_feature_flag,
            "requires_permissions": list(block.requires_permissions),
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

    def _navigation_mode(
        self,
        organization_id: int | None,
        workspace_id: int | None,
        project_id: int | None,
    ) -> str:
        if workspace_id is not None or project_id is not None:
            return "work"
        if organization_id is not None:
            return "org"
        return "platform"

    def _organization_payload(self, organization: Organization | None) -> dict | None:
        if organization is None:
            return None
        return {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
            "is_active": organization.is_active,
        }

    def _workspace_payload(self, workspace: Workspace | None) -> dict | None:
        if workspace is None:
            return None
        return {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "organization_id": workspace.organization_id,
            "is_active": workspace.is_active,
        }

    def _project_payload(self, project: Project | None) -> dict | None:
        if project is None:
            return None
        return {
            "id": project.id,
            "name": project.name,
            "key": project.key,
            "workspace_id": project.workspace_id,
            "status": project.status,
            "is_active": project.is_active,
        }
