import base64
import json
from typing import Any


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def decode_jwt_without_verification(token: str) -> dict[str, Any]:
    """Decode JWT claims without verifying signature or trust.

    Core Service remains the source of truth for token validation. This helper is
    only for lightweight downstream parsing of an already-forwarded token.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed JWT token.")

    try:
        claims = json.loads(_base64url_decode(parts[1]).decode("utf-8"))
    except (ValueError, json.JSONDecodeError) as exc:
        raise ValueError("JWT claims could not be decoded.") from exc

    if not isinstance(claims, dict):
        raise ValueError("JWT claims payload must be an object.")
    return claims


def extract_claims(token: str) -> dict[str, Any]:
    return decode_jwt_without_verification(token)


def extract_subject(token: str) -> str | None:
    claims = decode_jwt_without_verification(token)
    subject = claims.get("sub")
    return str(subject) if subject is not None else None
