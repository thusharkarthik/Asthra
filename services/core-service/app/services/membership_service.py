from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import OrganizationMember
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.repositories.invitation_repository import InvitationRepository
from app.services.activity_service import ActivityService


class MembershipService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = InvitationRepository(db)

    def remove_organization_member(
        self,
        organization_id: int,
        user_id: int,
        current_user: User,
    ) -> None:
        self._ensure_active_user(current_user)
        self._ensure_organization_access(organization_id, current_user)
        member = self._get_organization_member(organization_id, user_id)
        self.db.delete(member)
        self.db.commit()
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization_id,
            entity_type="organization_member",
            entity_id=str(user_id),
            action="member.removed",
            description=f"User {user_id} was removed from organization {organization_id}.",
        )

    def remove_workspace_member(
        self,
        workspace_id: int,
        user_id: int,
        current_user: User,
    ) -> None:
        self._ensure_active_user(current_user)
        self._ensure_workspace_access(workspace_id, current_user)
        member = self._get_workspace_member(workspace_id, user_id)
        self.db.delete(member)
        self.db.commit()
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            workspace_id=workspace_id,
            entity_type="workspace_member",
            entity_id=str(user_id),
            action="member.removed",
            description=f"User {user_id} was removed from workspace {workspace_id}.",
        )

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _ensure_organization_access(self, organization_id: int, user: User) -> None:
        organization = self.repository.get_organization(organization_id)
        if organization is None or not organization.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        if user.is_superuser or organization.created_by_id == user.id:
            return
        if self.repository.is_organization_member(organization_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid membership access.")

    def _ensure_workspace_access(self, workspace_id: int, user: User) -> None:
        workspace = self.repository.get_workspace(workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        if user.is_superuser or workspace.created_by_id == user.id:
            return
        if self.repository.is_workspace_member(workspace_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid membership access.")

    def _get_organization_member(self, organization_id: int, user_id: int) -> OrganizationMember:
        member = (
            self.db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization member not found.")
        return member

    def _get_workspace_member(self, workspace_id: int, user_id: int) -> WorkspaceMember:
        member = (
            self.db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
            .first()
        )
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace member not found.")
        return member
