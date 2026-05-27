from fastapi import APIRouter

from app.routes import gateway, proxy

api_router = APIRouter()
api_router.include_router(gateway.router)
api_router.include_router(proxy.router)
