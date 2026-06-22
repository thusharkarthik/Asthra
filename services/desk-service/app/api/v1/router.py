from fastapi import APIRouter

from app.api.v1 import approvals, change_requests, dashboard, incidents, queues, slas, tickets

api_router = APIRouter()
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(queues.router, prefix="/queues", tags=["queues"])
api_router.include_router(slas.router, prefix="/slas", tags=["slas"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(change_requests.router, prefix="/change-requests", tags=["change-requests"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
