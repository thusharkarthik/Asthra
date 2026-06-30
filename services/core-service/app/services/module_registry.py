from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.module_registry import ModuleRegistry
from app.models.user import User
from app.services.access_control_service import AccessControlService
from app.services.feature_flags import FeatureFlagService


VALID_NAVIGATION_MODES = {"platform", "org", "work", "personal"}


@dataclass(frozen=True)
class DefaultModuleDefinition:
    module_key: str
    name: str
    description: str
    category: str
    route: str
    icon: str
    navigation_mode: str
    required_feature_flag: str | None
    required_permissions: tuple[str, ...]
    sort_order: int


DEFAULT_MODULES: tuple[DefaultModuleDefinition, ...] = (
    DefaultModuleDefinition("platform_home", "Home", "Platform overview.", "platform", "/", "home", "platform", None, (), 10),
    DefaultModuleDefinition("organizations", "Organizations", "Manage platform organizations.", "platform", "/settings/organizations", "building2", "platform", None, ("settings.organization.view",), 20),
    DefaultModuleDefinition("platform_members", "Members", "Global member directory.", "platform", "/settings/members", "users", "platform", None, ("settings.member.view",), 30),
    DefaultModuleDefinition("access_control", "Access Control", "Manage roles, permissions, and assignments.", "platform", "/settings/access-control", "shield", "platform", None, ("settings.access_control.view", "settings.role.view", "settings.permission.view"), 40),
    DefaultModuleDefinition("audit_logs", "Audit Logs", "Review platform and organization activity.", "platform", "/settings/audit-logs", "scroll_text", "platform", None, ("guard.audit.view",), 50),
    DefaultModuleDefinition("api_keys", "API Keys", "Manage personal API keys.", "platform", "/settings/api-keys", "key", "platform", None, (), 60),
    DefaultModuleDefinition("platform_health", "Platform Health", "Monitor platform service health.", "platform", "/platform/health", "activity", "platform", None, ("settings.organization.view",), 70),
    DefaultModuleDefinition("platform_settings", "Settings", "Open platform settings.", "platform", "/settings", "settings", "platform", None, (), 100),
    DefaultModuleDefinition("org_home", "Home", "Organization overview.", "organization", "/", "home", "org", None, (), 10),
    DefaultModuleDefinition("workspaces", "Workspaces", "Manage organization workspaces.", "organization", "/settings/workspaces", "layers", "org", None, ("settings.workspace.view",), 20),
    DefaultModuleDefinition("org_members", "Members", "Manage organization members.", "organization", "/settings/members", "users", "org", None, ("settings.member.view",), 30),
    DefaultModuleDefinition("teams", "Teams", "Manage organization and workspace teams.", "organization", "/settings/teams", "users_round", "org", None, ("settings.team.view",), 40),
    DefaultModuleDefinition("roles", "Roles", "Review organization roles.", "organization", "/settings/roles", "shield", "org", None, ("settings.role.view",), 50),
    DefaultModuleDefinition("org_settings", "Org Settings", "Manage organization settings.", "organization", "/settings/organizations", "building2", "org", None, ("settings.organization.view",), 80),
    DefaultModuleDefinition("preferences", "Preferences", "Manage personal preferences.", "organization", "/settings/preferences", "sliders_horizontal", "org", None, (), 90),
    DefaultModuleDefinition("profile", "Profile", "Manage your profile.", "organization", "/settings/profile", "user", "org", None, (), 100),
    DefaultModuleDefinition("home", "Home", "Work home.", "work", "/", "home", "work", None, (), 10),
    DefaultModuleDefinition("flow", "Flow", "Plan, track, and deliver work.", "execution", "/flow", "zap", "work", "module.flow.enabled", ("flow.work_item.view", "flow.board.view"), 100),
    DefaultModuleDefinition("discover", "Discover", "Manage ideas, validation, and roadmap signals.", "product", "/discover", "lightbulb", "work", "module.discover.enabled", ("discover.idea.view",), 110),
    DefaultModuleDefinition("docs", "Docs", "Create and browse knowledge.", "knowledge", "/docs", "book_open", "work", "module.docs.enabled", ("docs.page.view", "docs.space.view"), 120),
    DefaultModuleDefinition("collab", "Collab", "Discuss work and announcements.", "collaboration", "/collab", "message_square", "work", "module.collab.enabled", ("collab.thread.view",), 130),
    DefaultModuleDefinition("desk", "Desk", "Manage support tickets and service queues.", "operations", "/desk", "ticket", "work", "module.desk.enabled", ("desk.ticket.view",), 200),
    DefaultModuleDefinition("pulse", "Pulse", "Manage incidents and operational health.", "operations", "/pulse", "activity", "work", "module.pulse.enabled", ("pulse.incident.view",), 210),
    DefaultModuleDefinition("automation", "Automation", "Manage automation rules and workflows.", "operations", "/automation", "workflow", "work", "module.automation.enabled", ("automation.rule.view",), 220),
    DefaultModuleDefinition("dev", "Dev", "Manage engineering operations.", "engineering", "/dev", "code2", "work", None, ("dev.release.view",), 300),
    DefaultModuleDefinition("connect", "Connect", "Manage integrations and webhooks.", "engineering", "/connect", "plug", "work", "module.connect.enabled", ("connect.integration.view",), 310),
    DefaultModuleDefinition("insights", "Insights", "View reports and analytics.", "intelligence", "/insights", "bar_chart3", "work", "module.insights.enabled", ("insights.report.view",), 400),
    DefaultModuleDefinition("memory", "Memory", "Open Asthra memory.", "intelligence", "/memory", "brain", "work", "module.memory.enabled", (), 410),
    DefaultModuleDefinition("assistant", "Assistant", "Open the Asthra assistant.", "intelligence", "/assistant", "bot", "work", "module.assistant.enabled", (), 420),
    DefaultModuleDefinition("work_settings", "Settings", "Open workspace settings.", "admin", "/settings", "settings", "work", None, (), 500),
)


class ModuleRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_default_modules(self) -> None:
        existing_by_key = {module.module_key: module for module in self.db.query(ModuleRegistry).all()}
        dirty = False
        for default in DEFAULT_MODULES:
            existing = existing_by_key.get(default.module_key)
            required_permissions = list(default.required_permissions)
            if existing is None:
                self.db.add(
                    ModuleRegistry(
                        module_key=default.module_key,
                        name=default.name,
                        description=default.description,
                        category=default.category,
                        route=default.route,
                        icon=default.icon,
                        navigation_mode=default.navigation_mode,
                        required_feature_flag=default.required_feature_flag,
                        required_permissions=required_permissions,
                        sort_order=default.sort_order,
                        is_system=True,
                        is_active=True,
                    )
                )
                dirty = True
                continue
            updates = {
                "name": default.name,
                "description": default.description,
                "category": default.category,
                "route": default.route,
                "icon": default.icon,
                "navigation_mode": default.navigation_mode,
                "required_feature_flag": default.required_feature_flag,
                "required_permissions": required_permissions,
                "sort_order": default.sort_order,
                "is_system": True,
            }
            for field, value in updates.items():
                if getattr(existing, field) != value:
                    setattr(existing, field, value)
                    dirty = True
        if dirty:
            self.db.commit()

    def get_module_catalog(self) -> list[ModuleRegistry]:
        self.ensure_default_modules()
        return self.db.query(ModuleRegistry).order_by(ModuleRegistry.navigation_mode, ModuleRegistry.sort_order, ModuleRegistry.name).all()

    def get_active_modules(self) -> list[ModuleRegistry]:
        self.ensure_default_modules()
        return (
            self.db.query(ModuleRegistry)
            .filter(ModuleRegistry.is_active.is_(True))
            .order_by(ModuleRegistry.navigation_mode, ModuleRegistry.sort_order, ModuleRegistry.name)
            .all()
        )

    def resolve_modules_for_context(
        self,
        user: User,
        *,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
        navigation_mode: str = "platform",
    ) -> list[dict]:
        navigation_mode = self._normalize_navigation_mode(navigation_mode)
        access = AccessControlService(self.db)
        permissions = access.get_user_permissions(user.id, scope_type, scope_id)
        permission_codes = set(permissions["permission_codes"])
        feature_flags = FeatureFlagService(self.db).get_effective_feature_flags(scope_type, scope_id)["feature_flags"]
        visible_modules: list[dict] = []
        for module in self.get_active_modules():
            if module.navigation_mode != navigation_mode:
                continue
            resolved = self._resolve_module(module, feature_flags, permission_codes, has_full_access=bool(user.is_superuser))
            if resolved["visible"]:
                visible_modules.append(resolved)
        return sorted(visible_modules, key=lambda item: (item["sort_order"], item["name"]))

    def _resolve_module(
        self,
        module: ModuleRegistry,
        feature_flags: dict[str, bool],
        permission_codes: set[str],
        *,
        has_full_access: bool = False,
    ) -> dict:
        feature_enabled = True
        if module.required_feature_flag:
            feature_enabled = bool(feature_flags.get(module.required_feature_flag, False))
        required_permissions = list(module.required_permissions or [])
        permission_allowed = True
        if required_permissions and not has_full_access:
            permission_allowed = bool(permission_codes.intersection(required_permissions))
        visible = bool(module.is_active and feature_enabled and permission_allowed)
        return {
            "module_key": module.module_key,
            "name": module.name,
            "description": module.description,
            "category": module.category,
            "route": module.route,
            "icon": module.icon,
            "navigation_mode": module.navigation_mode,
            "required_feature_flag": module.required_feature_flag,
            "required_permissions": required_permissions,
            "sort_order": module.sort_order,
            "enabled": feature_enabled,
            "visible": visible,
        }

    def _normalize_navigation_mode(self, navigation_mode: str) -> str:
        normalized = navigation_mode.strip().lower()
        if normalized == "organization":
            normalized = "org"
        if normalized not in VALID_NAVIGATION_MODES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported navigation mode.")
        return normalized
