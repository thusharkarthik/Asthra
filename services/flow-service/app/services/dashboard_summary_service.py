from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dashboard_summary import FlowDashboardSummary
from app.models.release import Release
from app.models.sprint import Sprint
from app.models.work_item import WorkItem
from app.models.work_item_status import WorkItemStatus


class FlowDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh(self, project_id: int) -> FlowDashboardSummary:
        rows = (
            self.db.query(WorkItemStatus.category, WorkItemStatus.key, WorkItemStatus.name, func.count(WorkItem.id))
            .join(WorkItem, WorkItem.status_id == WorkItemStatus.id)
            .filter(WorkItem.project_id == project_id, WorkItem.is_active.is_(True))
            .group_by(WorkItemStatus.category, WorkItemStatus.key, WorkItemStatus.name)
            .all()
        )
        open_count = in_progress = blocked = completed = 0
        for category, key, name, count in rows:
            value = str(key or name or category).lower().replace(" ", "_")
            bucket = str(category or "").lower()
            if value in {"blocked", "blocker"}:
                blocked += count
            elif bucket in {"completed", "done"} or value in {"done", "closed", "completed"}:
                completed += count
            elif bucket in {"active", "review"} or value in {"in_progress", "review"}:
                in_progress += count
            else:
                open_count += count

        summary = self.db.query(FlowDashboardSummary).filter(FlowDashboardSummary.project_id == project_id).first()
        if summary is None:
            summary = FlowDashboardSummary(project_id=project_id)
            self.db.add(summary)
        summary.open_work_items = open_count
        summary.in_progress_items = in_progress
        summary.blocked_items = blocked
        summary.completed_items = completed
        summary.active_sprints = self.db.query(Sprint).filter(Sprint.project_id == project_id, Sprint.status == "active").count()
        summary.active_releases = self.db.query(Release).filter(Release.project_id == project_id, Release.status == "active").count()
        self.db.commit()
        self.db.refresh(summary)
        return summary
