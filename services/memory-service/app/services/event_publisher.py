from typing import Any

from app.core.config import settings

try:
    from shared_events.client import EventClient
except ImportError:  # pragma: no cover - optional shared package fallback
    EventClient = None


def publish_event(
    event_name: str,
    *,
    payload: dict[str, Any] | None = None,
    workspace_id: int | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> dict[str, Any]:
    if not settings.event_publishing_enabled or not settings.event_service_url or EventClient is None:
        return {"success": True, "published": False, "mode": "noop", "error": None}

    try:
        client = EventClient(settings.event_service_url)
        event = client.build_event(
            event_name=event_name,
            source_service=settings.app_name,
            payload=payload or {},
            workspace_id=workspace_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return client.publish_event(event)
    except Exception as exc:
        return {"success": False, "published": False, "mode": "safe_failure", "error": str(exc)}
