from sqlalchemy.orm import Session

from app.models.dashboard_summary import PulseDashboardSummary
from app.models.incident import Incident


class PulseDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh(self, workspace_id: int) -> PulseDashboardSummary:
        incidents = self.db.query(Incident).filter(Incident.workspace_id == workspace_id)
        summary = self.db.query(PulseDashboardSummary).filter(PulseDashboardSummary.workspace_id == workspace_id).first()
        if summary is None:
            summary = PulseDashboardSummary(workspace_id=workspace_id)
            self.db.add(summary)
        summary.active_incidents = incidents.filter(Incident.status.notin_(["resolved", "closed"])).count()
        summary.sev1_count = incidents.filter(Incident.severity == "sev1").count()
        summary.sev2_count = incidents.filter(Incident.severity == "sev2").count()
        summary.resolved_incidents = incidents.filter(Incident.status.in_(["resolved", "closed"])).count()
        self.db.commit()
        self.db.refresh(summary)
        return summary
