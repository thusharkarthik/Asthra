from dataclasses import asdict, dataclass

from app.core.config import Settings, settings


@dataclass(frozen=True)
class ServiceDefinition:
    name: str
    base_url: str
    health_path: str = "/health"
    status: str = "configured"

    def to_dict(self) -> dict:
        return asdict(self)


def build_service_registry(config: Settings = settings) -> dict[str, ServiceDefinition]:
    return {
        "core": ServiceDefinition("core-service", config.core_service_url),
        "flow": ServiceDefinition("flow-service", config.flow_service_url),
        "docs": ServiceDefinition("docs-service", config.docs_service_url),
        "ai": ServiceDefinition("ai-service", config.ai_service_url),
        "memory": ServiceDefinition("memory-service", config.memory_service_url),
        "discover": ServiceDefinition("discover-service", config.discover_service_url),
        "desk": ServiceDefinition("desk-service", config.desk_service_url),
        "pulse": ServiceDefinition("pulse-service", config.pulse_service_url),
        "dev": ServiceDefinition("dev-service", config.dev_service_url),
        "collab": ServiceDefinition("collab-service", config.collab_service_url),
        "automation": ServiceDefinition("automation-service", config.automation_service_url),
        "connect": ServiceDefinition("connect-service", config.connect_service_url),
        "guard": ServiceDefinition("guard-service", config.guard_service_url),
        "insights": ServiceDefinition("insights-service", config.insights_service_url),
        "media": ServiceDefinition("media-service", config.media_service_url),
    }


def service_registry_response(config: Settings = settings) -> list[dict]:
    return [service.to_dict() for service in build_service_registry(config).values()]
