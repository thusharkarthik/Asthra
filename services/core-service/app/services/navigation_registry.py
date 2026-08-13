from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.user import User
from app.services.access_control_service import AccessControlService
from app.services.feature_flags import FeatureFlagService
from app.services.module_registry import ModuleRegistryService


NAVIGATION_REGISTRY_VERSION = 1
VALID_NAVIGATION_MODES = ("platform", "org", "work", "settings", "personal")


@dataclass(frozen=True)
class NavigationItemDefinition:
    nav_key: str
    label: str
    route: str
    mode: str
    group: str
    icon: str
    order: int
    required_any_permissions: tuple[str, ...] = ()
    required_feature_flag: str | None = None
    module_key: str | None = None
    default_visible: bool = True
    is_customizable: bool = True
    description: str | None = None


DEFAULT_NAVIGATION_ITEMS: tuple[NavigationItemDefinition, ...] = (
    NavigationItemDefinition("platform.home", "Home", "/", "platform", "Platform", "home", 10, is_customizable=False),
    NavigationItemDefinition("platform.organizations", "Organizations", "/settings/organizations", "platform", "Platform", "building2", 20, ("settings.organization.view", "settings.organization.manage")),
    NavigationItemDefinition("platform.members", "Members", "/settings/members", "platform", "Platform", "users", 30, ("settings.member.view", "settings.member.manage")),
    NavigationItemDefinition("platform.access_control", "Access Control", "/settings/access-control", "platform", "Platform", "shield", 40, ("settings.access_control.view", "settings.role.view", "settings.permission.view")),
    NavigationItemDefinition("platform.audit_logs", "Audit Logs", "/settings/audit-logs", "platform", "Platform", "scroll_text", 50, ("guard.audit.view",)),
    NavigationItemDefinition("platform.api_keys", "API Keys", "/settings/api-keys", "platform", "Platform", "key", 60),
    NavigationItemDefinition("platform.health", "Platform Health", "/platform/health", "platform", "Platform", "activity", 70, ("settings.organization.view", "settings.access_control.view")),
    NavigationItemDefinition("platform.settings", "Settings", "/settings", "platform", "Admin", "settings", 100),
    NavigationItemDefinition("organization.home", "Home", "/", "org", "Organization", "home", 10, is_customizable=False),
    NavigationItemDefinition("organization.workspaces", "Workspaces", "/settings/workspaces", "org", "Organization", "layers", 20, ("settings.workspace.view", "settings.workspace.manage", "settings.workspace.create")),
    NavigationItemDefinition("organization.projects", "Projects", "/settings/projects", "org", "Organization", "folder_kanban", 25, ("settings.project.view", "settings.project.manage", "settings.project.create")),
    NavigationItemDefinition("organization.members", "Members", "/settings/members", "org", "Organization", "users", 30, ("settings.member.view", "settings.member.manage", "settings.member.invite")),
    NavigationItemDefinition("organization.teams", "Teams", "/settings/teams", "org", "Organization", "users_round", 40, ("settings.team.view", "settings.team.manage", "settings.team.create")),
    NavigationItemDefinition("organization.roles", "Roles", "/settings/roles", "org", "Organization", "shield", 50, ("settings.role.view", "settings.role.manage", "settings.access_control.view")),
    NavigationItemDefinition("organization.settings", "Org Settings", "/settings/organizations", "org", "Settings", "building2", 80, ("settings.organization.view", "settings.organization.manage", "settings.organization.edit")),
    NavigationItemDefinition("organization.preferences", "Preferences", "/settings/preferences", "org", "Settings", "sliders_horizontal", 90),
    NavigationItemDefinition("organization.profile", "Profile", "/settings/profile", "org", "Settings", "user", 100),
    NavigationItemDefinition("work.home", "Home", "/", "work", "Work", "home", 10, is_customizable=False),
    NavigationItemDefinition("work.flow", "Flow", "/flow", "work", "Work", "zap", 100, ("flow.work_item.view", "flow.board.view"), "module.flow.enabled", "flow"),
    NavigationItemDefinition("work.discover", "Discover", "/discover", "work", "Work", "lightbulb", 110, ("discover.idea.view",), "module.discover.enabled", "discover"),
    NavigationItemDefinition("work.docs", "Docs", "/docs", "work", "Work", "book_open", 120, ("docs.page.view", "docs.space.view"), "module.docs.enabled", "docs"),
    NavigationItemDefinition("work.collab", "Collab", "/collab", "work", "Work", "message_square", 130, ("collab.thread.view",), "module.collab.enabled", "collab"),
    NavigationItemDefinition("work.desk", "Desk", "/desk", "work", "Operations", "ticket", 200, ("desk.ticket.view",), "module.desk.enabled", "desk"),
    NavigationItemDefinition("work.pulse", "Pulse", "/pulse", "work", "Operations", "activity", 210, ("pulse.incident.view",), "module.pulse.enabled", "pulse"),
    NavigationItemDefinition("work.automation", "Automation", "/automation", "work", "Operations", "workflow", 220, ("automation.rule.view",), "module.automation.enabled", "automation"),
    NavigationItemDefinition("work.dev", "Dev", "/dev", "work", "Engineering", "code2", 300, ("dev.release.view",), None, "dev"),
    NavigationItemDefinition("work.connect", "Connect", "/connect", "work", "Engineering", "plug", 310, ("connect.integration.view",), "module.connect.enabled", "connect"),
    NavigationItemDefinition("work.insights", "Insights", "/insights", "work", "Intelligence", "bar_chart3", 400, ("insights.report.view",), "module.insights.enabled", "insights"),
    NavigationItemDefinition("work.memory", "Memory", "/memory", "work", "Intelligence", "brain", 410, required_feature_flag="module.memory.enabled", module_key="memory"),
    NavigationItemDefinition("work.assistant", "Assistant", "/assistant", "work", "Intelligence", "bot", 420, required_feature_flag="module.assistant.enabled", module_key="assistant"),
    NavigationItemDefinition("work.settings", "Settings", "/settings", "work", "Admin", "settings", 500),
    NavigationItemDefinition("settings.profile", "Profile", "/settings/profile", "settings", "Personal", "user", 10),
    NavigationItemDefinition("settings.preferences", "Preferences", "/settings/preferences", "settings", "Personal", "sliders_horizontal", 20),
    NavigationItemDefinition("settings.notifications", "Notifications", "/settings/notifications", "settings", "Personal", "bell", 30),
    NavigationItemDefinition("settings.account", "Account", "/settings/account", "settings", "Personal", "settings", 40),
)


class NavigationRegistryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_registry(self) -> list[NavigationItemDefinition]:
        return sorted(DEFAULT_NAVIGATION_ITEMS, key=lambda item: (item.mode, item.group, item.order, item.label))

    def resolve_navigation_for_context(
        self,
        user: User,
        *,
        scope_type: str | None = "platform",
        scope_id: int | None = None,
        modes: tuple[str, ...] = VALID_NAVIGATION_MODES,
    ) -> dict:
        access = AccessControlService(self.db)
        permissions = access.get_user_permissions(user.id, scope_type, scope_id)
        permission_codes = set(permissions["permission_codes"])
        feature_flags = FeatureFlagService(self.db).get_effective_feature_flags(scope_type, scope_id)["feature_flags"]
        module_service = ModuleRegistryService(self.db)
        visible_module_keys_by_mode = {
            mode: {
                module["module_key"]
                for module in module_service.resolve_modules_for_context(
                    user,
                    scope_type=scope_type,
                    scope_id=scope_id,
                    navigation_mode=mode,
                )
            }
            for mode in modes
            if mode in ("platform", "org", "work", "personal")
        }

        modes_payload: dict[str, dict[str, list[dict]]] = {}
        for mode in modes:
            items = [
                self._item_to_payload(item)
                for item in sorted(DEFAULT_NAVIGATION_ITEMS, key=lambda nav_item: (nav_item.order, nav_item.label))
                if item.mode == mode and self._is_visible(
                    item,
                    feature_flags=feature_flags,
                    permission_codes=permission_codes,
                    visible_module_keys=visible_module_keys_by_mode.get(mode, set()),
                    has_full_access=bool(user.is_superuser),
                )
            ]
            modes_payload[mode] = {"items": items}
        return {"version": NAVIGATION_REGISTRY_VERSION, "modes": modes_payload}

    def _is_visible(
        self,
        item: NavigationItemDefinition,
        *,
        feature_flags: dict[str, bool],
        permission_codes: set[str],
        visible_module_keys: set[str],
        has_full_access: bool,
    ) -> bool:
        if not item.default_visible:
            return False
        if item.required_feature_flag and not feature_flags.get(item.required_feature_flag, False):
            return False
        if item.module_key and item.mode in ("platform", "org", "work") and item.module_key not in visible_module_keys:
            return False
        if item.required_any_permissions and not has_full_access and not permission_codes.intersection(item.required_any_permissions):
            return False
        return True

    def _item_to_payload(self, item: NavigationItemDefinition) -> dict:
        return {
            "nav_key": item.nav_key,
            "label": item.label,
            "route": item.route,
            "mode": item.mode,
            "group": item.group,
            "icon": item.icon,
            "order": item.order,
            "required_any_permissions": list(item.required_any_permissions),
            "required_feature_flag": item.required_feature_flag,
            "module_key": item.module_key,
            "default_visible": item.default_visible,
            "is_customizable": item.is_customizable,
            "description": item.description,
            "children": [],
        }
