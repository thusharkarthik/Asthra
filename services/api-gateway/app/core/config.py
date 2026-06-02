from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

try:
    from shared_config.env import get_list_env
except ImportError:  # pragma: no cover - fallback for services before package installation

    def get_list_env(name: str, separator: str = ",") -> list[str]:
        return []


class Settings(BaseSettings):
    app_name: str = Field(default="asthra-api-gateway", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cors_origins_raw: str = Field(default="", alias="ASTHRA_CORS_ORIGINS")

    core_service_url: str = Field(default="http://localhost:8000", alias="CORE_SERVICE_URL")
    flow_service_url: str = Field(default="http://localhost:8001", alias="FLOW_SERVICE_URL")
    docs_service_url: str = Field(default="http://localhost:8002", alias="DOCS_SERVICE_URL")
    ai_service_url: str = Field(default="http://localhost:8003", alias="AI_SERVICE_URL")
    memory_service_url: str = Field(default="http://localhost:8004", alias="MEMORY_SERVICE_URL")
    discover_service_url: str = Field(default="http://localhost:8005", alias="DISCOVER_SERVICE_URL")
    desk_service_url: str = Field(default="http://localhost:8006", alias="DESK_SERVICE_URL")
    pulse_service_url: str = Field(default="http://localhost:8007", alias="PULSE_SERVICE_URL")
    dev_service_url: str = Field(default="http://localhost:8008", alias="DEV_SERVICE_URL")
    collab_service_url: str = Field(default="http://localhost:8009", alias="COLLAB_SERVICE_URL")
    automation_service_url: str = Field(default="http://localhost:8010", alias="AUTOMATION_SERVICE_URL")
    connect_service_url: str = Field(default="http://localhost:8011", alias="CONNECT_SERVICE_URL")
    guard_service_url: str = Field(default="http://localhost:8012", alias="GUARD_SERVICE_URL")
    insights_service_url: str = Field(default="http://localhost:8013", alias="INSIGHTS_SERVICE_URL")
    media_service_url: str = Field(default="http://localhost:8014", alias="MEDIA_SERVICE_URL")
    event_service_url: str = Field(default="http://localhost:8015", alias="EVENT_SERVICE_URL")

    proxy_timeout_seconds: float = Field(default=30.0, alias="PROXY_TIMEOUT_SECONDS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        configured = get_list_env("ASTHRA_CORS_ORIGINS", separator=",")
        if configured:
            return configured
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
