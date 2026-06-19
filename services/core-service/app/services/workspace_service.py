from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.services.access_control_service import AccessControlService
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
            "settings.workspace.manage",
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
        return workspace

    def list(self, current_user: User) -> list[Workspace]:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            return self.workspace_repository.list_all()
        return self.workspace_repository.list_for_user(current_user.id)

    def get(self, workspace_id: int, current_user: User) -> Workspace:
        self._ensure_active_user(current_user)
        workspace = self.workspace_repository.get_by_id(workspace_id)
        if workspace is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        if not workspace.is_active:
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
        AccessControlService(self.db).require(
            current_user,
            "settings.workspace.manage",
            "workspace",
            workspace.id,
        )
        return self.workspace_repository.update(workspace, workspace_update)

    def delete(self, workspace_id: int, current_user: User) -> None:
        workspace = self.get(workspace_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.workspace.manage",
            "workspace",
            workspace.id,
        )
        self.workspace_repository.update(workspace, WorkspaceUpdate(is_active=False))

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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

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
