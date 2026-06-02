from collections.abc import Mapping
from typing import Any
from uuid import uuid4

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


def generate_request_id() -> str:
    return str(uuid4())


def generate_correlation_id() -> str:
    return str(uuid4())


def _get_header(headers: Mapping[str, Any] | None, header_name: str) -> str | None:
    if not headers:
        return None
    for key, value in headers.items():
        if key.lower() == header_name.lower():
            return str(value)
    return None


def get_request_id(headers: Mapping[str, Any] | None, generate_if_missing: bool = True) -> str | None:
    return _get_header(headers, REQUEST_ID_HEADER) or (generate_request_id() if generate_if_missing else None)


def get_correlation_id(headers: Mapping[str, Any] | None, generate_if_missing: bool = True) -> str | None:
    return _get_header(headers, CORRELATION_ID_HEADER) or (generate_correlation_id() if generate_if_missing else None)
