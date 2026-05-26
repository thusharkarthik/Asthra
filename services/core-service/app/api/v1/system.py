from fastapi import APIRouter, Request

from app.core.config import settings
from app.core.responses import success_response


router = APIRouter()


@router.get("/info")
def system_info(request: Request):
    return success_response(
        data={
            "service_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "api_version": settings.api_v1_prefix,
        },
        request_id=getattr(request.state, "request_id", None),
    )
