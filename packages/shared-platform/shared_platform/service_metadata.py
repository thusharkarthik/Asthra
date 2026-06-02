from typing import Any


def build_service_info(
    app_name: str,
    app_version: str,
    environment: str,
    api_version: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    data = {
        "service": app_name,
        "version": app_version,
        "environment": environment,
        "api_version": api_version,
    }
    if extra:
        data.update(extra)
    return data
