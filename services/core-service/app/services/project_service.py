from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project, ProjectTeam
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectTeamCreate, ProjectUpdate
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService
from app.services.event_publisher import publish_event
from app.services.notification_service import NotificationService


class ProjectService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.project_repository = ProjectRepository(db)

    def create(self, project_create: ProjectCreate, current_user: User) -> Project:
        self._ensure_active_user(current_user)
        workspace = self._get_active_workspace(project_create.workspace_id)
        self._ensure_workspace_access(workspace, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.project.manage",
            "workspace",
            workspace.id,
        )
        owner_id = self._resolve_owner_id(project_create.owner_id, workspace.id)
        key = self._build_unique_key(workspace_id=workspace.id, name=project_create.name)
        project = self.project_repository.create(
            workspace=workspace,
            name=project_create.name.strip(),
            key=key,
            description=project_create.description,
            status=project_create.status,
            owner_id=owner_id,
            created_by_id=current_user.id,
        )
        if project.owner_id is not None and project.owner_id != current_user.id:
            NotificationService(self.project_repository.db).create_notification(
                user_id=project.owner_id,
                type="project.created",
                title="New project",
                message=f"You were assigned as owner for project '{project.name}'.",
                organization_id=workspace.organization_id,
                workspace_id=workspace.id,
                project_id=project.id,
                entity_type="project",
                entity_id=str(project.id),
            )
        publish_event(
            "core.project.created",
            payload={"name": project.name, "status": project.status},
            workspace_id=project.workspace_id,
            organization_id=workspace.organization_id,
            actor_user_id=current_user.id,
            entity_type="project",
            entity_id=str(project.id),
        )
        ContextVersionService(self.db).bump_workspace_context(project.workspace_id)
        self.db.commit()
        self.db.refresh(project)
        return project

    def list(
        self,
        current_user: User,
        *,
        workspace_id: int | None = None,
        status_filter: str | None = None,
        include_inactive: bool = False,
    ) -> list[Project]:
        self._ensure_active_user(current_user)
        include_all = include_inactive or status_filter in {"all", "inactive", "archived"}
        if current_user.is_superuser:
            projects = self.project_repository.list_all(include_inactive=include_all)
        else:
            projects = self.project_repository.list_for_user(current_user.id, include_inactive=include_all)
        if workspace_id is not None:
            projects = [project for project in projects if project.workspace_id == workspace_id]
        if status_filter in {"inactive", "archived"}:
            return [project for project in projects if not project.is_active or project.status in {"inactive", "archived"}]
        if status_filter == "active":
            return [project for project in projects if project.is_active and project.status not in {"inactive", "archived"}]
        return projects

    def get(self, project_id: int, current_user: User) -> Project:
        self._ensure_active_user(current_user)
        project = self.project_repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        self._ensure_workspace_access(project.workspace, current_user)
        return project

    def update(self, project_id: int, project_update: ProjectUpdate, current_user: User) -> Project:
        project = self.get(project_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.project.manage",
            "project",
            project.id,
        )
        if project_update.owner_id is not None:
            self._resolve_owner_id(project_update.owner_id, project.workspace_id)
        project = self.project_repository.update(project, project_update)
        ContextVersionService(self.db).bump_project_context(project.id)
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project_id: int, current_user: User) -> None:
        project = self.get(project_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.project.manage",
            "project",
            project.id,
        )
        self.project_repository.update(project, ProjectUpdate(is_active=False))
        ContextVersionService(self.db).bump_project_context(project.id)
        self.db.commit()

    def link_team(
        self,
        project_id: int,
        project_team_create: ProjectTeamCreate,
        current_user: User,
    ) -> ProjectTeam:
        project = self.get(project_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.project.manage",
            "project",
            project.id,
        )
        team = self.project_repository.get_team(project_team_create.team_id)
        if team is None or not team.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
        if team.workspace_id != project.workspace_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Team does not belong to this project's workspace.",
            )
        if self.project_repository.get_project_team(project.id, team.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Team is already linked to this project.",
            )
        return self.project_repository.link_team(
            project=project,
            team=team,
            actor_user_id=current_user.id,
        )

    def list_teams(self, project_id: int, current_user: User) -> list[ProjectTeam]:
        project = self.get(project_id, current_user)
        return self.project_repository.list_project_teams(project.id)

    def unlink_team(self, project_id: int, team_id: int, current_user: User) -> None:
        project = self.get(project_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.project.manage",
            "project",
            project.id,
        )
        project_team = self.project_repository.get_project_team(project.id, team_id)
        if project_team is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project team link not found.",
            )
        self.project_repository.unlink_team(
            project=project,
            project_team=project_team,
            actor_user_id=current_user.id,
        )

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _get_active_workspace(self, workspace_id: int) -> Workspace:
        workspace = self.project_repository.get_workspace(workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        return workspace

    def _ensure_workspace_access(self, workspace: Workspace, user: User) -> None:
        if user.is_superuser or workspace.created_by_id == user.id:
            return
        if self.project_repository.is_workspace_member(workspace.id, user.id):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

    def _resolve_owner_id(self, owner_id: int | None, workspace_id: int) -> int | None:
        if owner_id is None:
            return None
        owner = self.project_repository.get_user(owner_id)
        if owner is None or not owner.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found.")
        if not self.project_repository.is_workspace_member(workspace_id, owner.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Project owner must be a workspace member.",
            )
        return owner.id

    def _build_unique_key(self, *, workspace_id: int, name: str) -> str:
        base_key = self._keyify(name)
        key = base_key
        suffix = 2
        while self.project_repository.get_by_workspace_and_key(workspace_id, key) is not None:
            key = f"{base_key}-{suffix}"
            suffix += 1
        return key

    def _keyify(self, value: str) -> str:
        key = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return key or "project"
