from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="asthra-memory-service", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins_raw: str = Field(default="", alias="ASTHRA_CORS_ORIGINS")
    database_url: str = Field(default="sqlite:///./asthra_memory.db", alias="DATABASE_URL")
    memory_chunk_size: int = Field(default=500, alias="MEMORY_CHUNK_SIZE")
    memory_chunk_overlap: int = Field(default=50, alias="MEMORY_CHUNK_OVERLAP")
    memory_placeholder_embedding_model: str = Field(
        default="placeholder-keyword-model",
        alias="MEMORY_PLACEHOLDER_EMBEDDING_MODEL",
    )
    embedding_provider: str = Field(default="mock", alias="EMBEDDING_PROVIDER")
    embedding_model_name: str = Field(default="mock-embedding-v1", alias="EMBEDDING_MODEL_NAME")
    vector_store_provider: str = Field(default="in_memory", alias="VECTOR_STORE_PROVIDER")
    event_service_url: str | None = Field(default=None, alias="EVENT_SERVICE_URL")
    event_publishing_enabled: bool = Field(default=False, alias="EVENT_PUBLISHING_ENABLED")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
