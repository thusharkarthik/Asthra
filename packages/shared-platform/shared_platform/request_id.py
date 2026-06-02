from collections.abc import Mapping
from typing import Any
from uuid import uuid4


REQUEST_ID_HEADER = "X-Request-ID"


def generate_request_id() -> str:
    return str(uuid4())


def get_request_id_from_headers(headers: Mapping[str, Any] | None) -> str | None:
    if not headers:
        return None
    for key, value in headers.items():
        if key.lower() == REQUEST_ID_HEADER.lower():
            return str(value)
    return None


class RequestIdASGIMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        request_id = headers.get(REQUEST_ID_HEADER.lower().encode(), b"").decode() or generate_request_id()
        scope.setdefault("state", {})["request_id"] = request_id

        async def send_with_request_id(message):
            if message["type"] == "http.response.start":
                message.setdefault("headers", []).append((REQUEST_ID_HEADER.encode(), request_id.encode()))
            await send(message)

        await self.app(scope, receive, send_with_request_id)
