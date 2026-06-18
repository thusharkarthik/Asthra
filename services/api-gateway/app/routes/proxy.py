from fastapi import APIRouter, Request, Response

from app.services.proxy import proxy_request
from app.services.registry import build_service_registry

router = APIRouter(tags=["proxy"])


PROXY_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]


def _make_proxy_endpoint(base_url: str):
    async def endpoint(path: str, request: Request) -> Response:
        return await proxy_request(request, base_url, path)

    return endpoint


for route_prefix, service in build_service_registry().items():
    router.add_api_route(
        f"/api/{route_prefix}/{{path:path}}",
        _make_proxy_endpoint(service.base_url),
        methods=PROXY_METHODS,
        name=f"proxy_{route_prefix}",
    )
