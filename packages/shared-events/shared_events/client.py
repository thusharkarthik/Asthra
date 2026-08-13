from typing import Any

from shared_events.envelope import EventEnvelope, build_event_envelope


class EventClient:
    def __init__(self, event_service_url: str | None = None):
        self.event_service_url = event_service_url.rstrip("/") if event_service_url else None

    @property
    def enabled(self) -> bool:
        return bool(self.event_service_url)

    def build_event(
        self,
        event_name: str,
        source_service: str,
        payload: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> EventEnvelope:
        return build_event_envelope(
            event_name=event_name,
            source_service=source_service,
            payload=payload,
            **kwargs,
        )

    def publish_event(self, event: EventEnvelope | dict[str, Any]) -> dict[str, Any]:
        if not self.enabled:
            return {"success": True, "published": False, "mode": "noop", "error": None}

        try:
            import httpx
        except ImportError:
            return {
                "success": False,
                "published": False,
                "mode": "http",
                "error": "httpx is not installed.",
            }

        payload = event.model_dump(mode="json") if isinstance(event, EventEnvelope) else event
        try:
            response = httpx.post(f"{self.event_service_url}/api/v1/events", json=payload, timeout=10.0)
            return {
                "success": response.status_code < 400,
                "published": response.status_code < 400,
                "mode": "http",
                "status_code": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else None,
                "error": None if response.status_code < 400 else response.text,
            }
        except Exception as exc:
            return {
                "success": False,
                "published": False,
                "mode": "http",
                "error": str(exc),
            }
