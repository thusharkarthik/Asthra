from fastapi import APIRouter
from app.api.v1 import alerts, escalation_policies, incidents, on_call_schedules, postmortems, status_pages

api_router = APIRouter()
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(on_call_schedules.router, prefix="/on-call-schedules", tags=["on-call-schedules"])
api_router.include_router(escalation_policies.router, prefix="/escalation-policies", tags=["escalation-policies"])
api_router.include_router(status_pages.router, prefix="/status-pages", tags=["status-pages"])
api_router.include_router(status_pages.component_router, prefix="/components", tags=["components"])
api_router.include_router(postmortems.router, prefix="/postmortems", tags=["postmortems"])
