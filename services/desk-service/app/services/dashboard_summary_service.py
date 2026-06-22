from sqlalchemy.orm import Session

from app.models.dashboard_summary import DeskDashboardSummary
from app.models.service_ticket import ServiceTicket


class DeskDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh(self, workspace_id: int) -> DeskDashboardSummary:
        tickets = self.db.query(ServiceTicket).filter(ServiceTicket.workspace_id == workspace_id)
        summary = self.db.query(DeskDashboardSummary).filter(DeskDashboardSummary.workspace_id == workspace_id).first()
        if summary is None:
            summary = DeskDashboardSummary(workspace_id=workspace_id)
            self.db.add(summary)
        summary.open_tickets = tickets.filter(ServiceTicket.status == "open").count()
        summary.assigned_tickets = tickets.filter(ServiceTicket.assignee_id.is_not(None)).count()
        summary.in_progress_tickets = tickets.filter(ServiceTicket.status == "in_progress").count()
        summary.resolved_tickets = tickets.filter(ServiceTicket.status.in_(["resolved", "closed"])).count()
        self.db.commit()
        self.db.refresh(summary)
        return summary
