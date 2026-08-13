def build_service_token_placeholder(service_name: str | None = None) -> str:
    """Return a non-secret placeholder for future service-to-service auth.

    TODO: Replace with signed service identity tokens issued by the platform.
    """
    suffix = service_name or "service"
    return f"service-token-placeholder:{suffix}"


def validate_service_token_placeholder(token: str | None) -> bool:
    """Validate only the current placeholder format.

    TODO: Replace with real service token validation against platform trust config.
    """
    return bool(token and token.startswith("service-token-placeholder:"))
