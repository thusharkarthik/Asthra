from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.project import Project, ProjectTeam
from app.models.team import Team
from app.models.user import RoleAssignment, User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.project import ProjectUpdate


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, project_id: int) -> Project | None:
        return self.db.get(Project, project_id)

    def get_workspace(self, workspace_id: int) -> Workspace | None:
        return self.db.get(Workspace, workspace_id)

    def get_team(self, team_id: int) -> Team | None:
        return self.db.get(Team, team_id)

    def get_user(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_workspace_and_key(self, workspace_id: int, key: str) -> Project | None:
        statement = select(Project).where(Project.workspace_id == workspace_id, Project.key == key)
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int, *, include_inactive: bool = False) -> list[Project]:
        from_workspace_membership = (
            select(Project.id.label("project_id"))
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Project.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        )
        from_project_assignment = (
            select(RoleAssignment.scope_id.label("project_id"))
            .where(
                RoleAssignment.user_id == user_id,
                RoleAssignment.scope_type == "project",
                RoleAssignment.status == "active",
                RoleAssignment.scope_id.is_not(None),
            )
        )
        from_workspace_assignment = (
            select(Project.id.label("project_id"))
            .join(RoleAssignment, RoleAssignment.scope_id == Project.workspace_id)
            .where(
                RoleAssignment.user_id == user_id,
                RoleAssignment.scope_type == "workspace",
                RoleAssignment.status == "active",
            )
        )
        from_organization_assignment = (
            select(Project.id.label("project_id"))
            .join(Workspace, Workspace.id == Project.workspace_id)
            .join(RoleAssignment, RoleAssignment.scope_id == Workspace.organization_id)
            .where(
                RoleAssignment.user_id == user_id,
                RoleAssignment.scope_type == "organization",
                RoleAssignment.status == "active",
            )
        )
        project_ids = from_workspace_membership.union(
            from_project_assignment,
            from_workspace_assignment,
            from_organization_assignment,
        )
        statement = (
            select(Project)
            .where(Project.id.in_(project_ids))
            .order_by(Project.created_at.desc())
        )
        if not include_inactive:
            statement = statement.where(Project.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def list_all(self, *, include_inactive: bool = False) -> list[Project]:
        statement = select(Project).order_by(Project.created_at.desc())
        if not include_inactive:
            statement = statement.where(Project.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def is_workspace_member(self, workspace_id: int, user_id: int) -> bool:
        statement = select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def get_project_team(self, project_id: int, team_id: int) -> ProjectTeam | None:
        statement = select(ProjectTeam).where(
            ProjectTeam.project_id == project_id,
            ProjectTeam.team_id == team_id,
        )
        return self.db.scalar(statement)

    def create(
        self,
        *,
        workspace: Workspace,
        name: str,
        key: str,
        description: str | None,
        status: str,
        owner_id: int | None,
        created_by_id: int,
    ) -> Project:
        project = Project(
            workspace_id=workspace.id,
            name=name,
            key=key,
            description=description,
            status=status,
            owner_id=owner_id,
            created_by_id=created_by_id,
        )
        self.db.add(project)
        self.db.flush()
        self.db.add(
            ActivityLog(
                actor_user_id=created_by_id,
                organization_id=workspace.organization_id,
                workspace_id=workspace.id,
                project_id=project.id,
                action="project.created",
                entity_type="project",
                entity_id=str(project.id),
                description=f"Project '{project.name}' was created.",
                summary=f"Project '{project.name}' was created.",
            )
        )
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project, project_update: ProjectUpdate) -> Project:
        update_data = project_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        self.db.commit()
        self.db.refresh(project)
        return project

    def link_team(self, *, project: Project, team: Team, actor_user_id: int) -> ProjectTeam:
        project_team = ProjectTeam(project_id=project.id, team_id=team.id)
        self.db.add(project_team)
        self.db.add(
            ActivityLog(
                actor_user_id=actor_user_id,
                organization_id=project.workspace.organization_id,
                workspace_id=project.workspace_id,
                project_id=project.id,
                action="project.team_linked",
                entity_type="project_team",
                entity_id=str(team.id),
                description=f"Team {team.id} was linked to project {project.id}.",
                summary=f"Team {team.id} was linked to project {project.id}.",
            )
        )
        self.db.commit()
        self.db.refresh(project_team)
        return project_team

    def unlink_team(self, *, project: Project, project_team: ProjectTeam, actor_user_id: int) -> None:
        team_id = project_team.team_id
        self.db.delete(project_team)
        self.db.add(
            ActivityLog(
                actor_user_id=actor_user_id,
                organization_id=project.workspace.organization_id,
                workspace_id=project.workspace_id,
                project_id=project.id,
                action="project.team_unlinked",
                entity_type="project_team",
                entity_id=str(team_id),
                description=f"Team {team_id} was unlinked from project {project.id}.",
                summary=f"Team {team_id} was unlinked from project {project.id}.",
            )
        )
        self.db.commit()

    def list_project_teams(self, project_id: int) -> list[ProjectTeam]:
        statement = (
            select(ProjectTeam)
            .where(ProjectTeam.project_id == project_id)
            .order_by(ProjectTeam.created_at.asc())
        )
        return list(self.db.scalars(statement).all())
