from collections.abc import Mapping
from typing import Any


AUTHORIZATION_HEADER = "Authorization"


def extract_bearer_token(authorization_header: str | None) -> str | None:
    if not authorization_header:
        return None

    parts = authorization_header.strip().split()
    if len(parts) != 2:
        return None

    scheme, token = parts
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def build_authorization_header(token: str) -> dict[str, str]:
    return {AUTHORIZATION_HEADER: f"Bearer {token}"}


def forward_auth_headers(headers: Mapping[str, Any] | None) -> dict[str, str]:
    if not headers:
        return {}

    forwarded: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower() == AUTHORIZATION_HEADER.lower():
            forwarded[AUTHORIZATION_HEADER] = str(value)
            break
    return forwarded
