from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace


class ContextVersionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_version(
        self,
        current_user: User,
        *,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
    ) -> dict:
        organization = self._resolve_organization(organization_id, workspace_id, project_id)
        workspace = self._resolve_workspace(workspace_id, project_id)
        project = self.db.get(Project, project_id) if project_id is not None else None
        if project_id is not None and project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

        return {
            "user_id": current_user.id,
            "organization_id": organization.id if organization else organization_id,
            "organization_version": organization.context_version if organization else 0,
            "workspace_id": workspace.id if workspace else workspace_id,
            "workspace_version": workspace.context_version if workspace else 0,
            "project_id": project.id if project else project_id,
            "project_version": project.context_version if project else 0,
            "access_version": self._access_version(organization, workspace, project),
            "generated_at": datetime.now(timezone.utc),
        }

    def bump_organization_context(self, organization_id: int | None) -> None:
        organization = self.db.get(Organization, organization_id) if organization_id is not None else None
        if organization is not None:
            organization.context_version = (organization.context_version or 0) + 1

    def bump_workspace_context(self, workspace_id: int | None, *, include_organization: bool = True) -> None:
        workspace = self.db.get(Workspace, workspace_id) if workspace_id is not None else None
        if workspace is None:
            return
        workspace.context_version = (workspace.context_version or 0) + 1
        if include_organization:
            self.bump_organization_context(workspace.organization_id)

    def bump_project_context(self, project_id: int | None, *, include_workspace: bool = True) -> None:
        project = self.db.get(Project, project_id) if project_id is not None else None
        if project is None:
            return
        project.context_version = (project.context_version or 0) + 1
        if include_workspace:
            self.bump_workspace_context(project.workspace_id)

    def bump_access(self, scope_type: str, scope_id: int | None) -> None:
        if scope_type == "platform":
            self._bump_all_access()
            return
        if scope_type == "organization":
            organization = self.db.get(Organization, scope_id) if scope_id is not None else None
            if organization is not None:
                organization.access_version = (organization.access_version or 0) + 1
            return
        if scope_type == "workspace":
            workspace = self.db.get(Workspace, scope_id) if scope_id is not None else None
            if workspace is not None:
                workspace.access_version = (workspace.access_version or 0) + 1
                organization = workspace.organization
                if organization is not None:
                    organization.access_version = (organization.access_version or 0) + 1
            return
        if scope_type == "project":
            project = self.db.get(Project, scope_id) if scope_id is not None else None
            if project is not None:
                project.access_version = (project.access_version or 0) + 1
                workspace = project.workspace
                if workspace is not None:
                    workspace.access_version = (workspace.access_version or 0) + 1
                    if workspace.organization is not None:
                        workspace.organization.access_version = (workspace.organization.access_version or 0) + 1
            return
        if scope_type == "team":
            return

    def _resolve_organization(
        self,
        organization_id: int | None,
        workspace_id: int | None,
        project_id: int | None,
    ) -> Organization | None:
        if organization_id is not None:
            organization = self.db.get(Organization, organization_id)
            if organization is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            return organization
        workspace = self._resolve_workspace(workspace_id, project_id)
        return workspace.organization if workspace is not None else None

    def _resolve_workspace(self, workspace_id: int | None, project_id: int | None) -> Workspace | None:
        if workspace_id is not None:
            workspace = self.db.get(Workspace, workspace_id)
            if workspace is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
            return workspace
        if project_id is not None:
            project = self.db.get(Project, project_id)
            if project is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            return project.workspace
        return None

    def _access_version(
        self,
        organization: Organization | None,
        workspace: Workspace | None,
        project: Project | None,
    ) -> int:
        versions = [
            organization.access_version if organization else 0,
            workspace.access_version if workspace else 0,
            project.access_version if project else 0,
        ]
        return max(versions)

    def _bump_all_access(self) -> None:
        for model in (Organization, Workspace, Project):
            self.db.query(model).update(
                {model.access_version: func.coalesce(model.access_version, 0) + 1},
                synchronize_session=False,
            )
