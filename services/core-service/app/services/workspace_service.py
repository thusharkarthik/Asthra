from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.services.access_control_service import AccessControlService
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.event_publisher import publish_event


class WorkspaceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.workspace_repository = WorkspaceRepository(db)

    def create(self, workspace_create: WorkspaceCreate, current_user: User) -> Workspace:
        self._ensure_active_user(current_user)
        if not self.workspace_repository.organization_exists(workspace_create.organization_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )
        AccessControlService(self.db).require(
            current_user,
            "settings.workspace.create",
            "organization",
            workspace_create.organization_id,
        )

        slug = self._build_unique_slug(
            organization_id=workspace_create.organization_id,
            name=workspace_create.name,
        )
        workspace = self.workspace_repository.create_with_owner(
            organization_id=workspace_create.organization_id,
            name=workspace_create.name.strip(),
            slug=slug,
            description=workspace_create.description,
            created_by_id=current_user.id,
        )
        publish_event(
            "core.workspace.created",
            payload={"name": workspace.name},
            workspace_id=workspace.id,
            organization_id=workspace.organization_id,
            actor_user_id=current_user.id,
            entity_type="workspace",
            entity_id=str(workspace.id),
        )
        ContextVersionService(self.db).bump_organization_context(workspace.organization_id)
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=workspace.organization_id,
            workspace_id=workspace.id,
            entity_type="workspace",
            entity_id=str(workspace.id),
            action="workspace.created",
            description=f"Workspace '{workspace.name}' was created by {actor_name}.",
        )
        self.db.commit()
        self.db.refresh(workspace)
        return workspace

    def list(
        self,
        current_user: User,
        *,
        organization_id: int | None = None,
        status_filter: str | None = None,
        include_inactive: bool = False,
    ) -> list[Workspace]:
        self._ensure_active_user(current_user)
        include_all = include_inactive or status_filter in {"all", "inactive", "archived"}
        if current_user.is_superuser:
            workspaces = self.workspace_repository.list_all(include_inactive=include_all)
        else:
            workspaces = self.workspace_repository.list_for_user(current_user.id, include_inactive=include_all)
        if organization_id is not None:
            workspaces = [workspace for workspace in workspaces if workspace.organization_id == organization_id]
        if status_filter == "inactive":
            return [workspace for workspace in workspaces if not workspace.is_active]
        if status_filter == "active":
            return [workspace for workspace in workspaces if workspace.is_active]
        return workspaces

    def get(self, workspace_id: int, current_user: User) -> Workspace:
        self._ensure_active_user(current_user)
        workspace = self.workspace_repository.get_by_id(workspace_id)
        if workspace is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        self._ensure_workspace_access(workspace, current_user)
        return workspace

    def update(
        self,
        workspace_id: int,
        workspace_update: WorkspaceUpdate,
        current_user: User,
    ) -> Workspace:
        workspace = self.get(workspace_id, current_user)
        permission_code = self._permission_for_workspace_update(workspace, workspace_update)
        AccessControlService(self.db).require(current_user, permission_code, "workspace", workspace.id)
        workspace = self.workspace_repository.update(workspace, workspace_update)
        ContextVersionService(self.db).bump_workspace_context(workspace.id)
        actor_name = current_user.full_name or current_user.email
        if permission_code == "settings.workspace.archive":
            action, verb = "workspace.archived", "archived"
        elif permission_code == "settings.workspace.restore":
            action, verb = "workspace.restored", "restored"
        else:
            action, verb = "workspace.updated", "updated"
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=workspace.organization_id,
            workspace_id=workspace.id,
            entity_type="workspace",
            entity_id=str(workspace.id),
            action=action,
            description=f"Workspace '{workspace.name}' was {verb} by {actor_name}.",
        )
        self.db.commit()
        self.db.refresh(workspace)
        return workspace

    def delete(self, workspace_id: int, current_user: User) -> None:
        workspace = self.get(workspace_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.workspace.archive",
            "workspace",
            workspace.id,
        )
        self.workspace_repository.update(workspace, WorkspaceUpdate(is_active=False))
        ContextVersionService(self.db).bump_workspace_context(workspace.id)
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=workspace.organization_id,
            workspace_id=workspace.id,
            entity_type="workspace",
            entity_id=str(workspace.id),
            action="workspace.archived",
            description=f"Workspace '{workspace.name}' was archived by {actor_name}.",
        )
        self.db.commit()

    def list_members(self, workspace_id: int, current_user: User) -> list[WorkspaceMember]:
        self.get(workspace_id, current_user)
        return self.workspace_repository.list_members(workspace_id)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _ensure_workspace_access(self, workspace: Workspace, user: User) -> None:
        if user.is_superuser or workspace.created_by_id == user.id:
            return
        if self.workspace_repository.is_member(workspace.id, user.id):
            return
        if AccessControlService(self.db).can_access_scope(user.id, "workspace", workspace.id):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

    def _permission_for_workspace_update(self, workspace: Workspace, workspace_update: WorkspaceUpdate) -> str:
        restoring = workspace.is_active is False and workspace_update.is_active is True
        archiving = workspace_update.is_active is False
        if restoring:
            return "settings.workspace.restore"
        if archiving:
            return "settings.workspace.archive"
        return "settings.workspace.edit"

    def _build_unique_slug(self, *, organization_id: int, name: str) -> str:
        base_slug = self._slugify(name)
        slug = base_slug
        suffix = 2
        while self.workspace_repository.get_by_org_and_slug(organization_id, slug) is not None:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        return slug

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return slug or "workspace"
