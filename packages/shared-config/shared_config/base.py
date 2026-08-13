from dataclasses import dataclass


@dataclass(frozen=True)
class ServiceConfig:
    app_name: str
    app_version: str
    environment: str
    api_prefix: str
    debug: bool = False
    database_url: str | None = None
