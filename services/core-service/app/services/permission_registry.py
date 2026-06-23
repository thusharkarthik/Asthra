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
        "access_control": ("organization", ["view", "manage"]),
        "notification": ("workspace", ["view", "delete", "manage"]),
        "audit": ("organization", ["view", "export"]),
    },
    "flow": {
        "work_item": ("project", ["crud", "archive", "restore", "assign", "transition", "comment", "link", "unlink"]),
        "board": ("project", ["view", "manage", "transition"]),
        "backlog": ("project", ["view", "manage"]),
        "sprint": ("project", ["view", "create", "edit", "delete", "start", "complete", "manage"]),
        "release": ("project", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "workflow": ("project", ["view", "create", "edit", "delete", "configure", "manage"]),
        "custom_field": ("project", ["view", "create", "edit", "delete", "manage"]),
        "dependency": ("project", ["view", "create", "delete", "link", "unlink", "manage"]),
        "comment": ("project", ["view", "create", "edit", "delete"]),
        "attachment": ("project", ["view", "upload", "download", "delete"]),
        "report": ("project", ["view", "export"]),
    },
    "docs": {
        "space": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "page": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "publish", "unpublish", "link", "unlink"]),
        "comment": ("workspace", ["view", "create", "edit", "delete"]),
        "version": ("workspace", ["view", "restore"]),
        "link": ("workspace", ["view", "link", "unlink", "manage"]),
    },
    "discover": {
        "idea": ("workspace", ["view", "create", "edit", "delete", "approve", "reject", "convert", "manage"]),
        "feature_request": ("workspace", ["view", "create", "edit", "delete", "approve", "reject", "convert", "manage"]),
        "feedback": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "roadmap": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "validation": ("workspace", ["view", "create", "edit", "approve", "reject", "manage"]),
        "delivery": ("workspace", ["view", "manage"]),
    },
    "desk": {
        "ticket": ("workspace", ["view", "create", "edit", "delete", "assign", "resolve", "close", "reopen", "manage"]),
        "queue": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "comment": ("workspace", ["view", "create", "edit", "delete"]),
        "report": ("workspace", ["view", "export"]),
    },
    "pulse": {
        "incident": ("workspace", ["view", "create", "edit", "delete", "assign", "resolve", "close", "reopen", "manage"]),
        "service": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "update": ("workspace", ["view", "create", "edit", "delete"]),
        "postmortem": ("workspace", ["view", "create", "edit", "publish", "manage"]),
        "report": ("workspace", ["view", "export"]),
    },
    "collab": {
        "thread": ("workspace", ["view", "create", "edit", "delete", "archive", "restore", "manage"]),
        "message": ("workspace", ["view", "create", "edit", "delete"]),
        "announcement": ("workspace", ["view", "create", "edit", "delete", "publish", "manage"]),
    },
    "dev": {
        "repository": ("workspace", ["view", "create", "edit", "delete", "manage"]),
        "release": ("workspace", ["view", "create", "edit", "delete", "publish", "manage"]),
        "deployment": ("workspace", ["view", "create", "execute", "cancel", "manage"]),
        "environment": ("workspace", ["view", "create", "edit", "delete", "configure", "manage"]),
        "version": ("workspace", ["view", "create", "edit", "delete"]),
    },
    "automation": {
        "rule": ("workspace", ["view", "create", "edit", "delete", "trigger", "execute", "manage"]),
        "workflow": ("workspace", ["view", "create", "edit", "delete", "execute", "manage"]),
    },
    "connect": {
        "integration": ("workspace", ["view", "create", "edit", "delete", "configure", "manage"]),
        "webhook": ("workspace", ["view", "create", "edit", "delete", "trigger", "manage"]),
    },
    "guard": {
        "audit": ("organization", ["view", "export"]),
        "security": ("organization", ["view", "manage"]),
        "compliance": ("organization", ["view", "manage", "export"]),
    },
    "insights": {
        "report": ("workspace", ["view", "create", "edit", "delete", "export", "manage"]),
        "dashboard": ("workspace", ["view", "create", "edit", "delete", "manage"]),
    },
    "media": {
        "asset": ("workspace", ["view", "upload", "download", "edit", "delete", "manage"]),
        "attachment": ("workspace", ["view", "upload", "download", "delete"]),
    },
}


def iter_registry_permissions() -> list[PermissionRegistryItem]:
    items: list[PermissionRegistryItem] = []
    for module, resources in REGISTRY_DEFINITIONS.items():
        for resource, (scope, actions) in resources.items():
            for action in expand_actions(actions):
                items.append(PermissionRegistryItem(module=module, resource=resource, action=action, scope=scope))
    return sorted(items, key=lambda item: item.code)
