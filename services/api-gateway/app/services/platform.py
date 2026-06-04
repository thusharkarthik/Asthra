from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from app.core.config import settings
from app.services.registry import service_health_response


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class EntityReference:
    source: str
    entity_type: str
    entity_id: str | int
    title: str
    href: str
    description: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ActivityItem:
    id: str
    source: str
    actor: str
    action: str
    entity: EntityReference
    timestamp: str

    def to_dict(self) -> dict:
        data = asdict(self)
        data["entity"] = self.entity.to_dict()
        return data


@dataclass
class NotificationItem:
    id: str
    type: str
    title: str
    message: str
    unread: bool
    created_at: str
    href: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Relationship:
    id: str
    from_entity: EntityReference
    to_entity: EntityReference
    relation: str
    created_at: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "from": self.from_entity.to_dict(),
            "to": self.to_entity.to_dict(),
            "relation": self.relation,
            "created_at": self.created_at,
        }


@dataclass
class PlatformState:
    activities: list[ActivityItem] = field(default_factory=list)
    notifications: list[NotificationItem] = field(default_factory=list)
    recent_items: list[EntityReference] = field(default_factory=list)
    favorites: list[EntityReference] = field(default_factory=list)
    relationships: list[Relationship] = field(default_factory=list)


def _seed_state() -> PlatformState:
    timestamp = "2026-06-04T10:00:00+00:00"
    work_item = EntityReference("flow", "work_item", 101, "API gateway routing", "/flow/work-items/101")
    docs_page = EntityReference("docs", "docs_page", 44, "Platform beta guide", "/docs/pages/44")
    idea = EntityReference("discover", "idea", 17, "Customer onboarding idea", "/discover/ideas/17")
    ticket = EntityReference("desk", "ticket", 12, "Login troubleshooting", "/desk/tickets/12")
    incident = EntityReference("pulse", "incident", 7, "API latency", "/pulse/incidents/7")
    release = EntityReference("dev", "release", 3, "Frontend beta release", "/dev/releases")
    thread = EntityReference("collab", "thread", 9, "Beta feedback thread", "/collab/threads/9")
    workflow = EntityReference("automation", "workflow", 5, "Daily digest workflow", "/automation/workflows/5")
    dashboard = EntityReference("insights", "dashboard", "workspace", "Workspace dashboard", "/insights")

    return PlatformState(
        activities=[
            ActivityItem("act-1", "flow", "Maya", "updated", work_item, timestamp),
            ActivityItem("act-2", "docs", "Thushar", "published", docs_page, timestamp),
            ActivityItem("act-3", "desk", "Support", "commented on", ticket, timestamp),
            ActivityItem("act-4", "pulse", "Reliability", "resolved", incident, timestamp),
            ActivityItem("act-5", "automation", "Automation", "scheduled", workflow, timestamp),
        ],
        notifications=[
            NotificationItem("notif-1", "mention", "Mention in Docs", "You were mentioned in Platform beta guide.", True, timestamp, "/docs/pages"),
            NotificationItem("notif-2", "incident", "Incident resolved", "API latency incident moved to resolved.", True, timestamp, "/pulse/incidents"),
            NotificationItem("notif-3", "ai_assistant", "Assistant ready", "Workspace assistant can answer questions with memory context.", False, timestamp, "/"),
        ],
        recent_items=[work_item, docs_page, ticket, incident, release],
        favorites=[work_item, docs_page, dashboard],
        relationships=[
            Relationship("rel-1", idea, work_item, "idea_to_work_item", timestamp),
            Relationship("rel-2", work_item, docs_page, "work_item_to_docs_page", timestamp),
            Relationship("rel-3", ticket, incident, "ticket_to_incident", timestamp),
            Relationship("rel-4", incident, release, "incident_to_release", timestamp),
            Relationship("rel-5", thread, work_item, "thread_to_work_item", timestamp),
        ],
    )


STATE = _seed_state()


def list_activity() -> list[dict]:
    return [item.to_dict() for item in STATE.activities]


def list_notifications() -> list[dict]:
    return [item.to_dict() for item in STATE.notifications]


def mark_notification_read(notification_id: str) -> dict | None:
    for item in STATE.notifications:
        if item.id == notification_id:
            item.unread = False
            return item.to_dict()
    return None


def dismiss_notification(notification_id: str) -> bool:
    before = len(STATE.notifications)
    STATE.notifications = [item for item in STATE.notifications if item.id != notification_id]
    return len(STATE.notifications) < before


def list_recent_items() -> list[dict]:
    return [item.to_dict() for item in STATE.recent_items]


def list_favorites() -> list[dict]:
    return [item.to_dict() for item in STATE.favorites]


def add_favorite(payload: dict) -> dict:
    favorite = EntityReference(
        source=payload["source"],
        entity_type=payload["entity_type"],
        entity_id=payload["entity_id"],
        title=payload["title"],
        href=payload["href"],
        description=payload.get("description"),
    )
    key = (favorite.source, favorite.entity_type, str(favorite.entity_id))
    STATE.favorites = [item for item in STATE.favorites if (item.source, item.entity_type, str(item.entity_id)) != key]
    STATE.favorites.insert(0, favorite)
    return favorite.to_dict()


def remove_favorite(source: str, entity_type: str, entity_id: str) -> bool:
    before = len(STATE.favorites)
    STATE.favorites = [
        item for item in STATE.favorites
        if (item.source, item.entity_type, str(item.entity_id)) != (source, entity_type, str(entity_id))
    ]
    return len(STATE.favorites) < before


def list_relationships() -> list[dict]:
    return [item.to_dict() for item in STATE.relationships]


def add_relationship(payload: dict) -> dict:
    relationship = Relationship(
        id=f"rel-{uuid4().hex[:8]}",
        from_entity=EntityReference(**payload["from"]),
        to_entity=EntityReference(**payload["to"]),
        relation=payload["relation"],
        created_at=utc_now(),
    )
    STATE.relationships.insert(0, relationship)
    return relationship.to_dict()


def workspace_dashboard_summary() -> dict:
    return {
        "work": {"label": "Open work items", "value": 8, "href": "/flow/work-items"},
        "docs": {"label": "Recent pages", "value": 12, "href": "/docs/pages"},
        "discovery": {"label": "Ideas in validation", "value": 5, "href": "/discover/ideas"},
        "desk": {"label": "Open tickets", "value": 4, "href": "/desk/tickets"},
        "pulse": {"label": "Active incidents", "value": 1, "href": "/pulse/incidents"},
        "dev": {"label": "Deployments", "value": 4, "href": "/dev/deployments"},
        "ai": {"label": "Assistant sessions", "value": 3, "href": "/settings/preferences"},
    }


async def platform_health() -> dict:
    health = await service_health_response()
    return {
        "gateway": {
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "status": "ready",
        },
        "status": health["status"],
        "services": health["services"],
    }
