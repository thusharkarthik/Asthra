from starlette.types import ASGIApp, Message, Receive, Scope, Send

try:
    from shared_observability.request_tracking import generate_request_id
except ImportError:  # pragma: no cover - fallback for services before package installation
    from uuid import uuid4

    def generate_request_id() -> str:
        return str(uuid4())


class RequestIdMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        request_id = headers.get(b"x-request-id", b"").decode() or generate_request_id()
        scope.setdefault("state", {})["request_id"] = request_id

        async def send_with_request_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                message.setdefault("headers", []).append((b"x-request-id", request_id.encode()))
            await send(message)

        await self.app(scope, receive, send_with_request_id)
