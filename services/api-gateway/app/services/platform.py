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
    source_type: str
    source_id: str | int
    target_type: str
    target_id: str | int
    relationship_type: str
    created_at: str
    source: EntityReference | None = None
    target: EntityReference | None = None
    created_by: str | int | None = None

    def to_dict(self) -> dict:
        source = self.source or _entity_reference(self.source_type, self.source_id)
        target = self.target or _entity_reference(self.target_type, self.target_id)
        return {
            "id": self.id,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "relationship_type": self.relationship_type,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "source": source.to_dict(),
            "target": target.to_dict(),
            "from": source.to_dict(),
            "to": target.to_dict(),
            "relation": self.relationship_type,
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
    work_item = EntityReference("flow", "flow_work_item", 101, "API gateway routing", "/flow/work-items/101")
    docs_page = EntityReference("docs", "docs_page", 44, "Platform beta guide", "/docs/pages/44")
    idea = EntityReference("discover", "discover_idea", 17, "Customer onboarding idea", "/discover/ideas/17")
    ticket = EntityReference("desk", "desk_ticket", 12, "Login troubleshooting", "/desk/tickets/12")
    incident = EntityReference("pulse", "pulse_incident", 7, "API latency", "/pulse/incidents/7")
    release = EntityReference("dev", "release", 3, "Frontend beta release", "/dev/releases")
    thread = EntityReference("collab", "collab_thread", 9, "Beta feedback thread", "/collab/threads/9")
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
            Relationship("rel-1", "discover_idea", 17, "flow_work_item", 101, "originates_from", timestamp, source=idea, target=work_item),
            Relationship("rel-2", "flow_work_item", 101, "docs_page", 44, "documents", timestamp, source=work_item, target=docs_page),
            Relationship("rel-3", "desk_ticket", 12, "pulse_incident", 7, "supports", timestamp, source=ticket, target=incident),
            Relationship("rel-4", "collab_thread", 9, "flow_work_item", 101, "references", timestamp, source=thread, target=work_item),
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


SUPPORTED_ENTITY_TYPES = {"flow_work_item", "docs_page", "discover_idea", "desk_ticket", "collab_thread", "pulse_incident"}
SUPPORTED_RELATIONSHIPS = {"relates_to", "blocks", "references", "originates_from", "documents", "supports", "duplicates"}


def _href_for(entity_type: str, entity_id: str | int) -> str:
    return {
        "flow_work_item": f"/flow/work-items/{entity_id}",
        "docs_page": f"/docs/pages/{entity_id}",
        "discover_idea": f"/discover/ideas/{entity_id}",
        "desk_ticket": f"/desk/tickets/{entity_id}",
        "collab_thread": f"/collab/threads/{entity_id}",
        "pulse_incident": f"/pulse/incidents/{entity_id}",
    }.get(entity_type, "/")


def _source_for(entity_type: str) -> str:
    return entity_type.split("_", 1)[0] if "_" in entity_type else entity_type


def _entity_reference(entity_type: str, entity_id: str | int, title: str | None = None) -> EntityReference:
    return EntityReference(_source_for(entity_type), entity_type, entity_id, title or f"{entity_type.replace('_', ' ').title()} {entity_id}", _href_for(entity_type, entity_id))


def _relationship_matches(item: Relationship, **filters) -> bool:
    source_type = filters.get("source_type")
    source_id = filters.get("source_id")
    target_type = filters.get("target_type")
    target_id = filters.get("target_id")
    entity_type = filters.get("entity_type")
    entity_id = filters.get("entity_id")
    relationship_type = filters.get("relationship_type")
    if source_type and item.source_type != source_type:
        return False
    if source_id and str(item.source_id) != str(source_id):
        return False
    if target_type and item.target_type != target_type:
        return False
    if target_id and str(item.target_id) != str(target_id):
        return False
    if relationship_type and item.relationship_type != relationship_type:
        return False
    if entity_type and entity_id:
        return (item.source_type == entity_type and str(item.source_id) == str(entity_id)) or (item.target_type == entity_type and str(item.target_id) == str(entity_id))
    return True


def list_relationships(**filters) -> list[dict]:
    return [item.to_dict() for item in STATE.relationships if _relationship_matches(item, **filters)]


def add_relationship(payload: dict) -> dict:
    if "from" in payload and "to" in payload:
        source = EntityReference(**payload["from"])
        target = EntityReference(**payload["to"])
        payload = {
            "source_type": payload.get("source_type") or source.entity_type,
            "source_id": payload.get("source_id") or source.entity_id,
            "target_type": payload.get("target_type") or target.entity_type,
            "target_id": payload.get("target_id") or target.entity_id,
            "relationship_type": payload.get("relationship_type") or payload.get("relation", "relates_to"),
            "source_title": source.title,
            "target_title": target.title,
            "created_by": payload.get("created_by"),
        }
    if payload["source_type"] not in SUPPORTED_ENTITY_TYPES or payload["target_type"] not in SUPPORTED_ENTITY_TYPES:
        raise ValueError("Unsupported entity type.")
    if payload["relationship_type"] not in SUPPORTED_RELATIONSHIPS:
        raise ValueError("Unsupported relationship type.")
    relationship = Relationship(
        id=f"rel-{uuid4().hex[:8]}",
        source_type=payload["source_type"],
        source_id=payload["source_id"],
        target_type=payload["target_type"],
        target_id=payload["target_id"],
        relationship_type=payload["relationship_type"],
        created_at=utc_now(),
        source=_entity_reference(payload["source_type"], payload["source_id"], payload.get("source_title")),
        target=_entity_reference(payload["target_type"], payload["target_id"], payload.get("target_title")),
        created_by=payload.get("created_by"),
    )
    STATE.relationships.insert(0, relationship)
    return relationship.to_dict()


def delete_relationship(relationship_id: str) -> bool:
    before = len(STATE.relationships)
    STATE.relationships = [item for item in STATE.relationships if item.id != relationship_id]
    return len(STATE.relationships) < before


def search_entities(query: str = "", module: str | None = None, entity_type: str | None = None) -> list[dict]:
    entity_map: dict[tuple[str, str], EntityReference] = {}
    for entity in [*STATE.recent_items, *STATE.favorites]:
        entity_map[(entity.entity_type, str(entity.entity_id))] = entity
    for item in STATE.activities:
        entity_map[(item.entity.entity_type, str(item.entity.entity_id))] = item.entity
    for relationship in STATE.relationships:
        data = relationship.to_dict()
        source = EntityReference(**data["source"])
        target = EntityReference(**data["target"])
        entity_map[(source.entity_type, str(source.entity_id))] = source
        entity_map[(target.entity_type, str(target.entity_id))] = target

    normalized = query.strip().lower()
    results = []
    for entity in entity_map.values():
        if module and entity.source != module:
            continue
        if entity_type and entity.entity_type != entity_type:
            continue
        haystack = f"{entity.title} {entity.description or ''} {entity.source} {entity.entity_type}".lower()
        if normalized and normalized not in haystack:
            continue
        results.append(entity.to_dict())
    return results


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
