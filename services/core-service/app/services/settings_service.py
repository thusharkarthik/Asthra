from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.settings import (
    OrganizationSettingsRead,
    OrganizationSettingsUpdate,
    WorkspaceSettingsRead,
    WorkspaceSettingsUpdate,
)
from app.services.activity_service import ActivityService


DEFAULT_ORGANIZATION_SETTINGS = {
    "default_timezone": None,
    "allow_public_invites": False,
    "default_member_role": "member",
}
DEFAULT_WORKSPACE_SETTINGS = {
    "default_project_visibility": "private",
    "default_timezone": None,
    "enable_activity_feed": True,
}


class SettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.organization_repository = OrganizationRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    def get_organization_settings(
        self,
        organization_id: int,
        current_user: User,
    ) -> OrganizationSettingsRead:
        organization = self._get_organization_with_access(organization_id, current_user)
        return OrganizationSettingsRead(**self._organization_settings(organization))

    def update_organization_settings(
        self,
        organization_id: int,
        settings_update: OrganizationSettingsUpdate,
        current_user: User,
    ) -> OrganizationSettingsRead:
        organization = self._get_organization_with_access(organization_id, current_user)
        settings = self._organization_settings(organization)
        settings.update(settings_update.model_dump(exclude_unset=True))
        organization.settings = settings
        self.db.commit()
        self.db.refresh(organization)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization_settings",
            entity_id=str(organization.id),
            action="organization.settings_updated",
            description=f"Organization {organization.id} settings were updated.",
        )
        return OrganizationSettingsRead(**settings)

    def get_workspace_settings(
        self,
        workspace_id: int,
        current_user: User,
    ) -> WorkspaceSettingsRead:
        workspace = self._get_workspace_with_access(workspace_id, current_user)
        return WorkspaceSettingsRead(**self._workspace_settings(workspace))

    def update_workspace_settings(
        self,
        workspace_id: int,
        settings_update: WorkspaceSettingsUpdate,
        current_user: User,
    ) -> WorkspaceSettingsRead:
        workspace = self._get_workspace_with_access(workspace_id, current_user)
        settings = self._workspace_settings(workspace)
        settings.update(settings_update.model_dump(exclude_unset=True))
        workspace.settings = settings
        self.db.commit()
        self.db.refresh(workspace)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=workspace.organization_id,
            workspace_id=workspace.id,
            entity_type="workspace_settings",
            entity_id=str(workspace.id),
            action="workspace.settings_updated",
            description=f"Workspace {workspace.id} settings were updated.",
        )
        return WorkspaceSettingsRead(**settings)

    def _get_organization_with_access(self, organization_id: int, user: User) -> Organization:
        self._ensure_active_user(user)
        organization = self.organization_repository.get_by_id(organization_id)
        if organization is None or not organization.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        if user.is_superuser or organization.created_by_id == user.id:
            return organization
        if self.organization_repository.is_member(organization_id, user.id):
            return organization
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid settings access.")

    def _get_workspace_with_access(self, workspace_id: int, user: User) -> Workspace:
        self._ensure_active_user(user)
        workspace = self.workspace_repository.get_by_id(workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        if user.is_superuser or workspace.created_by_id == user.id:
            return workspace
        if self.workspace_repository.is_member(workspace_id, user.id):
            return workspace
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid settings access.")

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _organization_settings(self, organization: Organization) -> dict:
        settings = DEFAULT_ORGANIZATION_SETTINGS.copy()
        settings.update(organization.settings or {})
        return settings

    def _workspace_settings(self, workspace: Workspace) -> dict:
        settings = DEFAULT_WORKSPACE_SETTINGS.copy()
        settings.update(workspace.settings or {})
        return settings
