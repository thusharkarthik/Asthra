from dataclasses import asdict, dataclass

import httpx

from app.core.config import Settings, settings


@dataclass(frozen=True)
class ServiceDefinition:
    route_prefix: str
    name: str
    base_url: str
    health_path: str = "/health"
    status: str = "configured"

    def to_dict(self) -> dict:
        return asdict(self)


def build_service_registry(config: Settings = settings) -> dict[str, ServiceDefinition]:
    return {
        "core": ServiceDefinition("core", "core-service", config.core_service_url),
        "flow": ServiceDefinition("flow", "flow-service", config.flow_service_url),
        "docs": ServiceDefinition("docs", "docs-service", config.docs_service_url),
        "ai": ServiceDefinition("ai", "ai-service", config.ai_service_url),
        "memory": ServiceDefinition("memory", "memory-service", config.memory_service_url),
        "discover": ServiceDefinition("discover", "discover-service", config.discover_service_url),
        "desk": ServiceDefinition("desk", "desk-service", config.desk_service_url),
        "pulse": ServiceDefinition("pulse", "pulse-service", config.pulse_service_url),
        "dev": ServiceDefinition("dev", "dev-service", config.dev_service_url),
        "collab": ServiceDefinition("collab", "collab-service", config.collab_service_url),
        "automation": ServiceDefinition("automation", "automation-service", config.automation_service_url),
        "connect": ServiceDefinition("connect", "connect-service", config.connect_service_url),
        "guard": ServiceDefinition("guard", "guard-service", config.guard_service_url),
        "insights": ServiceDefinition("insights", "insights-service", config.insights_service_url),
        "media": ServiceDefinition("media", "media-service", config.media_service_url),
        "events": ServiceDefinition("events", "event-service", config.event_service_url),
    }


def service_registry_response(config: Settings = settings) -> list[dict]:
    return [service.to_dict() for service in build_service_registry(config).values()]


async def check_service_health(service: ServiceDefinition, timeout_seconds: float = 3.0) -> dict:
    health_url = service.base_url.rstrip("/") + service.health_path
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.get(health_url)
    except httpx.TimeoutException:
        return {**service.to_dict(), "health_url": health_url, "status": "timeout"}
    except httpx.RequestError:
        return {**service.to_dict(), "health_url": health_url, "status": "unavailable"}

    return {
        **service.to_dict(),
        "health_url": health_url,
        "status": "healthy" if response.status_code < 500 else "unhealthy",
        "status_code": response.status_code,
    }


async def service_health_response(config: Settings = settings) -> dict:
    services = build_service_registry(config).values()
    results = [await check_service_health(service) for service in services]
    overall_status = "healthy" if all(result["status"] == "healthy" for result in results) else "degraded"
    return {"status": overall_status, "services": results}
