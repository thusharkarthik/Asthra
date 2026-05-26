from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.team import Team, TeamMember
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.team import TeamUpdate


class TeamRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, team_id: int) -> Team | None:
        return self.db.get(Team, team_id)

    def get_user(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_workspace(self, workspace_id: int) -> Workspace | None:
        return self.db.get(Workspace, workspace_id)

    def get_by_workspace_and_slug(self, workspace_id: int, slug: str) -> Team | None:
        statement = select(Team).where(
            Team.workspace_id == workspace_id,
            Team.slug == slug,
        )
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int, *, include_inactive: bool = False) -> list[Team]:
        statement = (
            select(Team)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Team.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Team.created_at.desc())
        )
        if not include_inactive:
            statement = statement.where(Team.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def list_all(self, *, include_inactive: bool = False) -> list[Team]:
        statement = select(Team).order_by(Team.created_at.desc())
        if not include_inactive:
            statement = statement.where(Team.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def is_workspace_member(self, workspace_id: int, user_id: int) -> bool:
        statement = select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def get_member(self, team_id: int, user_id: int) -> TeamMember | None:
        statement = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
        return self.db.scalar(statement)

    def create_with_owner(
        self,
        *,
        workspace: Workspace,
        name: str,
        slug: str,
        description: str | None,
        created_by_id: int,
    ) -> Team:
        team = Team(
            workspace_id=workspace.id,
            name=name,
            slug=slug,
            description=description,
            created_by_id=created_by_id,
        )
        self.db.add(team)
        self.db.flush()

        self.db.add(
            TeamMember(
                team_id=team.id,
                user_id=created_by_id,
                member_role="owner",
            )
        )
        self.db.add(
            ActivityLog(
                actor_user_id=created_by_id,
                organization_id=workspace.organization_id,
                workspace_id=workspace.id,
                action="team.created",
                entity_type="team",
                entity_id=str(team.id),
                summary=f"Team '{team.name}' was created.",
            )
        )
        self.db.commit()
        self.db.refresh(team)
        return team

    def update(self, team: Team, team_update: TeamUpdate) -> Team:
        update_data = team_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(team, field, value)
        self.db.commit()
        self.db.refresh(team)
        return team

    def add_member(
        self,
        *,
        team: Team,
        user_id: int,
        role_id: int | None,
        member_role: str,
        actor_user_id: int,
    ) -> TeamMember:
        member = TeamMember(
            team_id=team.id,
            user_id=user_id,
            role_id=role_id,
            member_role=member_role,
        )
        self.db.add(member)
        self.db.add(
            ActivityLog(
                actor_user_id=actor_user_id,
                organization_id=team.workspace.organization_id,
                workspace_id=team.workspace_id,
                action="team.member_added",
                entity_type="team_member",
                entity_id=str(user_id),
                summary=f"User {user_id} was added to team {team.id}.",
            )
        )
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_member(self, *, team: Team, member: TeamMember, actor_user_id: int) -> None:
        removed_user_id = member.user_id
        self.db.delete(member)
        self.db.add(
            ActivityLog(
                actor_user_id=actor_user_id,
                organization_id=team.workspace.organization_id,
                workspace_id=team.workspace_id,
                action="team.member_removed",
                entity_type="team_member",
                entity_id=str(removed_user_id),
                summary=f"User {removed_user_id} was removed from team {team.id}.",
            )
        )
        self.db.commit()

    def list_members(self, team_id: int) -> list[TeamMember]:
        statement = (
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .order_by(TeamMember.created_at.asc())
        )
        return list(self.db.scalars(statement).all())
