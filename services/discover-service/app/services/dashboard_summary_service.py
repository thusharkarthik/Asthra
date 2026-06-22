from sqlalchemy.orm import Session

from app.models.dashboard_summary import DiscoverDashboardSummary
from app.models.idea import Idea


class DiscoverDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh(self, workspace_id: int) -> DiscoverDashboardSummary:
        ideas = self.db.query(Idea).filter(Idea.workspace_id == workspace_id)
        summary = self.db.query(DiscoverDashboardSummary).filter(DiscoverDashboardSummary.workspace_id == workspace_id).first()
        if summary is None:
            summary = DiscoverDashboardSummary(workspace_id=workspace_id)
            self.db.add(summary)
        summary.total_ideas = ideas.count()
        summary.reviewing = ideas.filter(Idea.status == "reviewing").count()
        summary.validating = ideas.filter(Idea.status == "validating").count()
        summary.approved = ideas.filter(Idea.status == "approved").count()
        summary.rejected = ideas.filter(Idea.status == "rejected").count()
        summary.converted_to_work = ideas.filter(Idea.status == "converted_to_work").count()
        self.db.commit()
        self.db.refresh(summary)
        return summary
