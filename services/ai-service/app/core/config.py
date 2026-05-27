from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="asthra-intelligence-service", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins: list[str] = Field(default_factory=list, alias="ASTHRA_CORS_ORIGINS")
    database_url: str = Field(default="sqlite:///./asthra_intelligence.db", alias="DATABASE_URL")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    ai_provider_timeout_seconds: float = Field(default=30.0, alias="AI_PROVIDER_TIMEOUT_SECONDS")
    openrouter_default_model: str = Field(
        default="openai/gpt-4o-mini",
        alias="OPENROUTER_DEFAULT_MODEL",
    )
    groq_default_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_DEFAULT_MODEL")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
