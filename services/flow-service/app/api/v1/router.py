from fastapi import APIRouter

from app.api.v1 import audit_events, attachments, automation_rules, boards, capacity, comments, custom_fields, labels, notifications, releases, saved_views, sprints, work_items, work_logs, workflows


api_router = APIRouter()
api_router.include_router(audit_events.router, tags=["audit-events"])
api_router.include_router(automation_rules.router, prefix="/automation-rules", tags=["automation-rules"])
api_router.include_router(work_items.router, prefix="/work-items", tags=["work-items"])
api_router.include_router(work_items.project_router, prefix="/projects", tags=["project-hierarchy"])
api_router.include_router(workflows.project_router, prefix="/projects", tags=["project-workflows"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(sprints.router, prefix="/sprints", tags=["sprints"])
api_router.include_router(releases.router, prefix="/releases", tags=["releases"])
api_router.include_router(saved_views.router, prefix="/saved-views", tags=["saved-views"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(labels.work_item_router, tags=["work-item-labels"])
api_router.include_router(custom_fields.router, prefix="/custom-field-definitions", tags=["custom-fields"])
api_router.include_router(custom_fields.work_item_router, tags=["custom-field-values"])
api_router.include_router(attachments.router, tags=["attachments"])
api_router.include_router(work_logs.router, tags=["work-logs"])
api_router.include_router(capacity.router, prefix="/capacity", tags=["capacity"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
