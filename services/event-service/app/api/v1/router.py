from fastapi import APIRouter

from app.api.v1 import delivery_logs, events, subscriptions

api_router = APIRouter()
api_router.include_router(events.router)
api_router.include_router(subscriptions.router)
api_router.include_router(delivery_logs.router)
