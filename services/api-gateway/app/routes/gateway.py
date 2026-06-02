from fastapi import APIRouter, Request

from app.core.config import settings
from app.core.responses import success_response
from app.services.registry import build_service_registry, service_health_response, service_registry_response

router = APIRouter(prefix="/api/gateway", tags=["gateway"])


@router.get("/info")
def gateway_info(request: Request) -> dict:
    return success_response(
        data={
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "supported_proxy_routes": [f"/api/{prefix}" for prefix in build_service_registry().keys()],
        },
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/services")
def gateway_services(request: Request) -> dict:
    return success_response(
        data={"services": service_registry_response()},
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/health/services")
async def gateway_service_health(request: Request) -> dict:
    return success_response(
        data=await service_health_response(),
        request_id=getattr(request.state, "request_id", None),
    )
