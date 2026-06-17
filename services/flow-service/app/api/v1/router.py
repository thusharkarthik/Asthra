from fastapi import APIRouter

from app.api.v1 import attachments, boards, comments, labels, releases, sprints, work_items, workflows


api_router = APIRouter()
api_router.include_router(work_items.router, prefix="/work-items", tags=["work-items"])
api_router.include_router(work_items.project_router, prefix="/projects", tags=["project-hierarchy"])
api_router.include_router(workflows.project_router, prefix="/projects", tags=["project-workflows"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(sprints.router, prefix="/sprints", tags=["sprints"])
api_router.include_router(releases.router, prefix="/releases", tags=["releases"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(labels.work_item_router, tags=["work-item-labels"])
api_router.include_router(attachments.router, tags=["attachments"])
