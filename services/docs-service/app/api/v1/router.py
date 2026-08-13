from fastapi import APIRouter

from app.api.v1 import attachments, comments, dashboard, pages, search, spaces, tags


api_router = APIRouter()
api_router.include_router(spaces.router, prefix="/spaces", tags=["spaces"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(attachments.router, tags=["attachments"])
api_router.include_router(tags.router, tags=["tags"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
