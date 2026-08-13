from shared_config.base import ServiceConfig


def build_service_config(
    app_name: str,
    app_version: str,
    environment: str,
    api_prefix: str,
    debug: bool = False,
    database_url: str | None = None,
) -> ServiceConfig:
    return ServiceConfig(
        app_name=app_name,
        app_version=app_version,
        environment=environment,
        api_prefix=api_prefix,
        debug=debug,
        database_url=database_url,
    )
