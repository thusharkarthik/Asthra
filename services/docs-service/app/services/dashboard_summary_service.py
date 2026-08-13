from sqlalchemy.orm import Session

from app.models.dashboard_summary import DocsDashboardSummary
from app.models.page import Page
from app.models.space import Space


class DocsDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh(self, workspace_id: int) -> DocsDashboardSummary:
        space_ids = [space_id for (space_id,) in self.db.query(Space.id).filter(Space.workspace_id == workspace_id, Space.is_active.is_(True)).all()]
        summary = self.db.query(DocsDashboardSummary).filter(DocsDashboardSummary.workspace_id == workspace_id).first()
        if summary is None:
            summary = DocsDashboardSummary(workspace_id=workspace_id)
            self.db.add(summary)
        summary.total_spaces = len(space_ids)
        if space_ids:
            pages = self.db.query(Page).filter(Page.space_id.in_(space_ids), Page.is_active.is_(True))
            summary.total_pages = pages.count()
            summary.draft_pages = pages.filter(Page.status == "draft").count()
            summary.published_pages = pages.filter(Page.status == "published").count()
        else:
            summary.total_pages = 0
            summary.draft_pages = 0
            summary.published_pages = 0
        self.db.commit()
        self.db.refresh(summary)
        return summary
