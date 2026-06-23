from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.team import Team, TeamMember
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.team_repository import TeamRepository
from app.schemas.team import TeamCreate, TeamMemberCreate, TeamUpdate
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService
from app.services.notification_service import NotificationService


class TeamService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.team_repository = TeamRepository(db)

    def create(self, team_create: TeamCreate, current_user: User) -> Team:
        self._ensure_active_user(current_user)
        workspace = self._get_active_workspace(team_create.workspace_id)
        AccessControlService(self.db).require(current_user, "settings.team.manage", "workspace", workspace.id)

        slug = self._build_unique_slug(workspace_id=workspace.id, name=team_create.name)
        try:
            team = self.team_repository.create_with_owner(
                workspace=workspace,
                name=team_create.name.strip(),
                slug=slug,
                description=team_create.description,
                created_by_id=current_user.id,
            )
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Team could not be created because a conflicting team or membership already exists in this workspace.",
            ) from exc
        ContextVersionService(self.db).bump_workspace_context(team.workspace_id)
        ContextVersionService(self.db).bump_access("workspace", team.workspace_id)
        self.db.commit()
        self.db.refresh(team)
        return team

    def list(self, current_user: User) -> list[Team]:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            return self.team_repository.list_all()
        return self.team_repository.list_for_user(current_user.id)

    def get(self, team_id: int, current_user: User) -> Team:
        self._ensure_active_user(current_user)
        team = self.team_repository.get_by_id(team_id)
        if team is None or not team.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found.",
            )
        self._ensure_team_view_access(team, current_user)
        return team

    def update(self, team_id: int, team_update: TeamUpdate, current_user: User) -> Team:
        team = self.get(team_id, current_user)
        AccessControlService(self.db).require(current_user, "settings.team.manage", "workspace", team.workspace_id)
        team = self.team_repository.update(team, team_update)
        ContextVersionService(self.db).bump_workspace_context(team.workspace_id)
        self.db.commit()
        self.db.refresh(team)
        return team

    def delete(self, team_id: int, current_user: User) -> None:
        team = self.get(team_id, current_user)
        AccessControlService(self.db).require(current_user, "settings.team.manage", "workspace", team.workspace_id)
        self.team_repository.update(team, TeamUpdate(is_active=False))
        ContextVersionService(self.db).bump_workspace_context(team.workspace_id)
        self.db.commit()

    def add_member(
        self,
        team_id: int,
        member_create: TeamMemberCreate,
        current_user: User,
    ) -> TeamMember:
        team = self.get(team_id, current_user)
        AccessControlService(self.db).require(current_user, "settings.team.manage", "workspace", team.workspace_id)
        target_user = self.team_repository.get_user(member_create.user_id)
        if target_user is None or not target_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        if not self.team_repository.is_workspace_member(team.workspace_id, target_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of this team's workspace.",
            )
        if self.team_repository.get_member(team.id, target_user.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a team member.",
            )

        member = self.team_repository.add_member(
            team=team,
            user_id=target_user.id,
            role_id=member_create.role_id,
            member_role=member_create.member_role,
            actor_user_id=current_user.id,
        )
        NotificationService(self.team_repository.db).create_notification(
            user_id=target_user.id,
            type="team.member_added",
            title="Added to team",
            message=f"You were added to team '{team.name}'.",
            organization_id=team.workspace.organization_id,
            workspace_id=team.workspace_id,
            entity_type="team",
            entity_id=str(team.id),
        )
        ContextVersionService(self.db).bump_access("workspace", team.workspace_id)
        self.db.commit()
        return member

    def list_members(self, team_id: int, current_user: User) -> list[TeamMember]:
        team = self.get(team_id, current_user)
        return self.team_repository.list_members(team.id)

    def remove_member(self, team_id: int, user_id: int, current_user: User) -> None:
        team = self.get(team_id, current_user)
        AccessControlService(self.db).require(current_user, "settings.team.manage", "workspace", team.workspace_id)
        member = self.team_repository.get_member(team.id, user_id)
        if member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found.",
            )
        self.team_repository.remove_member(
            team=team,
            member=member,
            actor_user_id=current_user.id,
        )
        ContextVersionService(self.db).bump_access("workspace", team.workspace_id)
        self.db.commit()

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _get_active_workspace(self, workspace_id: int) -> Workspace:
        workspace = self.team_repository.get_workspace(workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        return workspace

    def _ensure_workspace_access(self, workspace: Workspace, user: User) -> None:
        if user.is_superuser or workspace.created_by_id == user.id:
            return
        if self.team_repository.is_workspace_member(workspace.id, user.id):
            return
        access = AccessControlService(self.db)
        if access.can(user.id, "settings.workspace.view", "workspace", workspace.id) or access.can(user.id, "settings.team.view", "workspace", workspace.id):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

    def _ensure_team_view_access(self, team: Team, user: User) -> None:
        try:
            AccessControlService(self.db).require(user, "settings.team.view", "workspace", team.workspace_id)
            return
        except HTTPException as exc:
            if exc.status_code != status.HTTP_403_FORBIDDEN:
                raise
        self._ensure_workspace_access(team.workspace, user)

    def _build_unique_slug(self, *, workspace_id: int, name: str) -> str:
        base_slug = self._slugify(name)
        slug = base_slug
        suffix = 2
        while self.team_repository.get_by_workspace_and_slug(workspace_id, slug) is not None:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        return slug

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return slug or "team"
