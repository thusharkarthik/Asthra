from fastapi import APIRouter

from app.routes import gateway, platform, proxy

api_router = APIRouter()
api_router.include_router(gateway.router)
api_router.include_router(platform.router)
api_router.include_router(platform.health_router)
api_router.include_router(proxy.router)
