from typing import Any
from urllib.parse import urljoin

import httpx
from fastapi import HTTPException, Request, Response, status

from app.core.config import settings

try:
    from shared_auth.auth_headers import forward_auth_headers
except ImportError:  # pragma: no cover - fallback for services before package installation

    def forward_auth_headers(headers: dict | None) -> dict[str, str]:
        if not headers:
            return {}
        authorization = headers.get("Authorization")
        return {"Authorization": authorization} if authorization else {}


HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


async def _request_body(request: Request) -> bytes | None:
    body = await request.body()
    return body or None


def _forward_headers(request: Request) -> dict[str, str]:
    headers: dict[str, str] = forward_auth_headers(request.headers)
    request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")
    if request_id:
        headers["X-Request-ID"] = request_id
    content_type = request.headers.get("Content-Type")
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _target_url(base_url: str, path: str) -> str:
    normalized_base = base_url.rstrip("/") + "/"
    normalized_path = path.lstrip("/")
    return urljoin(normalized_base, normalized_path)


def _response_headers(headers: httpx.Headers) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS and key.lower() != "content-length"
    }


async def proxy_request(request: Request, base_url: str, path: str) -> Response:
    target_url = _target_url(base_url, path)
    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout_seconds) as client:
            upstream_response = await client.request(
                method=request.method,
                url=target_url,
                params=request.query_params,
                content=await _request_body(request),
                headers=_forward_headers(request),
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Downstream service timed out.",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Downstream service is unavailable.",
        ) from exc

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=_response_headers(upstream_response.headers),
        media_type=upstream_response.headers.get("content-type"),
    )
