from sqlalchemy.orm import Session

from app.models.dashboard_summary import ProjectSummary, WorkspaceSummary
from app.models.project import Project, ProjectMembership
from app.models.team import Team
from app.models.workspace import Workspace, WorkspaceMember


class CoreDashboardSummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh_workspace_summary(self, organization_id: int) -> WorkspaceSummary:
        workspace_ids = [row[0] for row in self.db.query(Workspace.id).filter(Workspace.organization_id == organization_id, Workspace.is_active.is_(True)).all()]
        summary = self.db.query(WorkspaceSummary).filter(WorkspaceSummary.organization_id == organization_id).first()
        if summary is None:
            summary = WorkspaceSummary(organization_id=organization_id)
            self.db.add(summary)
        summary.workspace_count = len(workspace_ids)
        summary.project_count = self.db.query(Project).filter(Project.workspace_id.in_(workspace_ids), Project.is_active.is_(True)).count() if workspace_ids else 0
        summary.team_count = self.db.query(Team).filter(Team.workspace_id.in_(workspace_ids), Team.is_active.is_(True)).count() if workspace_ids else 0
        summary.member_count = self.db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id.in_(workspace_ids)).count() if workspace_ids else 0
        self.db.commit()
        self.db.refresh(summary)
        return summary

    def refresh_project_summary(self, workspace_id: int) -> ProjectSummary:
        project_ids = [row[0] for row in self.db.query(Project.id).filter(Project.workspace_id == workspace_id, Project.is_active.is_(True)).all()]
        summary = self.db.query(ProjectSummary).filter(ProjectSummary.workspace_id == workspace_id).first()
        if summary is None:
            summary = ProjectSummary(workspace_id=workspace_id)
            self.db.add(summary)
        summary.project_count = len(project_ids)
        summary.team_count = self.db.query(Team).filter(Team.workspace_id == workspace_id, Team.is_active.is_(True)).count()
        summary.member_count = self.db.query(ProjectMembership).filter(ProjectMembership.project_id.in_(project_ids), ProjectMembership.status == "active").count() if project_ids else 0
        self.db.commit()
        self.db.refresh(summary)
        return summary
