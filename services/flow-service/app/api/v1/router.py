from fastapi import APIRouter

from app.api.v1 import attachments, boards, comments, labels, work_items


api_router = APIRouter()
api_router.include_router(work_items.router, prefix="/work-items", tags=["work-items"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(labels.work_item_router, tags=["work-item-labels"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
