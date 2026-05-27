from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="asthra-core-service", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins_raw: str = Field(default="", alias="ASTHRA_CORS_ORIGINS")

    database_url: str = Field(
        default="sqlite:///./asthra_core.db",
        alias="DATABASE_URL",
    )

    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    bcrypt_rounds: int = Field(default=12, alias="BCRYPT_ROUNDS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def service_name(self) -> str:
        return self.app_name

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
