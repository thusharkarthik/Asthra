from fastapi import APIRouter, Request, Response

from app.core.config import settings
from app.services.proxy import proxy_request

router = APIRouter(tags=["proxy"])


@router.api_route("/api/core/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_core(path: str, request: Request) -> Response:
    return await proxy_request(request, settings.core_service_url, path)


@router.api_route("/api/flow/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_flow(path: str, request: Request) -> Response:
    return await proxy_request(request, settings.flow_service_url, path)


@router.api_route("/api/docs/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_docs(path: str, request: Request) -> Response:
    return await proxy_request(request, settings.docs_service_url, path)


@router.api_route("/api/ai/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_ai(path: str, request: Request) -> Response:
    return await proxy_request(request, settings.ai_service_url, path)


@router.api_route("/api/memory/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_memory(path: str, request: Request) -> Response:
    return await proxy_request(request, settings.memory_service_url, path)


# TODO: Expand proxy coverage to all Asthra services after gateway policies are standardized.
