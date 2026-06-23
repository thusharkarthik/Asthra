from __future__ import annotations

from dataclasses import dataclass


ACTION_TEMPLATES: dict[str, list[str]] = {
    "crud": ["view", "create", "edit", "delete"],
    "lifecycle": ["archive", "restore"],
    "assignment": ["assign", "remove"],
    "workflow": ["start", "complete", "transition", "approve", "reject", "cancel"],
    "content": ["publish", "unpublish", "comment", "upload", "download"],
    "linking": ["link", "unlink"],
}

ACTION_NAMES: dict[str, str] = {
    "view": "View",
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "archive": "Archive",
    "restore": "Restore",
    "manage": "Manage",
    "invite": "Invite",
    "remove": "Remove",
    "assign": "Assign",
    "resend": "Resend",
    "cancel": "Cancel",
    "publish": "Publish",
    "unpublish": "Unpublish",
    "approve": "Approve",
    "reject": "Reject",
    "convert": "Convert",
    "start": "Start",
    "complete": "Complete",
    "transition": "Transition",
    "link": "Link",
    "unlink": "Unlink",
    "comment": "Comment",
    "upload": "Upload",
    "download": "Download",
    "export": "Export",
    "configure": "Configure",
    "execute": "Execute",
    "trigger": "Trigger",
    "resolve": "Resolve",
    "close": "Close",
    "reopen": "Reopen",
    "add": "Add",
}

HIGH_RISK_ACTIONS = {"delete", "archive", "restore", "manage", "remove", "assign", "cancel", "configure", "execute"}
MEDIUM_RISK_ACTIONS = {"create", "edit", "invite", "resend", "approve", "reject", "convert", "start", "complete", "transition", "resolve", "close", "reopen", "publish", "unpublish", "upload", "link", "unlink", "add"}


@dataclass(frozen=True)
class PermissionRegistryItem:
    module: str
    resource: str
    action: str
    scope: str

    @property
    def code(self) -> str:
        return f"{self.module}.{self.resource}.{self.action}"

    @property
    def name(self) -> str:
        return f"{ACTION_NAMES.get(self.action, self.action.replace('_', ' ').title())} {self.resource.replace('_', ' ').title()}"

    @property
    def description(self) -> str:
        return f"Allows {self.action.replace('_', ' ')} access for {self.resource.replace('_', ' ')} within allowed {self.scope} scope."

    @property
    def risk_level(self) -> str:
        if self.action in HIGH_RISK_ACTIONS:
            return "high"
        if self.action in MEDIUM_RISK_ACTIONS:
            return "medium"
        return "low"


def expand_actions(actions: list[str]) -> list[str]:
    expanded: list[str] = []
    for action in actions:
        expanded.extend(ACTION_TEMPLATES.get(action, [action]))
    return list(dict.fromkeys(expanded))


REGISTRY_DEFINITIONS: dict[str, dict[str, tuple[str, list[str]]]] = {
    "settings": {
        "organization": ("organization", ["view", "create", "edit", "archive", "restore", "manage"]),
        "workspace": ("workspace", ["view", "create", "edit", "archive", "restore", "manage"]),
        "project": ("project", ["view", "create", "edit", "archive", "restore", "manage"]),
        "team": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "team.member": ("workspace", ["add", "remove", "assign"]),
        "member": ("workspace", ["view", "invite", "remove", "resend", "cancel", "manage"]),
        "role": ("organization", ["view", "create", "edit", "delete", "manage", "assign"]),
        "permission": ("organization", ["view", "create", "edit", "delete", "manage"]),
    },
    "flow": {
        "work_item": ("project", ["view", "create", "edit", "delete", "archive", "restore", "manage", "assign"]),
        "sprint": ("project", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "release": ("project", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "workflow": ("project", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
    },
    "docs": {
        "space": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "page": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "manage", "publish"]),
    },
    "discover": {
        "idea": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "manage", "approve", "reject", "convert"]),
        "roadmap": ("workspace", ["view", "create", "edit", "delete", "manage"]),
    },
}


def iter_registry_permissions() -> list[PermissionRegistryItem]:
    items: list[PermissionRegistryItem] = []
    for module, resources in REGISTRY_DEFINITIONS.items():
        for resource, (scope, actions) in resources.items():
            for action in expand_actions(actions):
                items.append(PermissionRegistryItem(module=module, resource=resource, action=action, scope=scope))
    return sorted(items, key=lambda item: item.code)
