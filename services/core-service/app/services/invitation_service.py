from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.user import User
from app.repositories.invitation_repository import InvitationRepository
from app.schemas.invitation import InvitationAccept, InvitationCreate
from app.services.activity_service import ActivityService


class InvitationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = InvitationRepository(db)

    def create(self, invitation_create: InvitationCreate, current_user: User) -> Invitation:
        self._ensure_active_user(current_user)
        email = invitation_create.email.lower()
        organization = self.repository.get_organization(invitation_create.organization_id)
        if organization is None or not organization.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        self._ensure_organization_access(invitation_create.organization_id, current_user)

        if invitation_create.workspace_id is not None:
            workspace = self.repository.get_workspace(invitation_create.workspace_id)
            if workspace is None or not workspace.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
            if workspace.organization_id != invitation_create.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workspace does not belong to this organization.",
                )
            self._ensure_workspace_access(invitation_create.workspace_id, current_user)

        if self.repository.get_pending_duplicate(
            email=email,
            organization_id=invitation_create.organization_id,
            workspace_id=invitation_create.workspace_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending invitation already exists for this email and scope.",
            )

        invitation = self.repository.create(
            email=email,
            organization_id=invitation_create.organization_id,
            workspace_id=invitation_create.workspace_id,
            invited_by_id=current_user.id,
            role_id=invitation_create.role_id,
            token=token_urlsafe(32),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="invitation.created",
            description=f"Invitation for {invitation.email} was created.",
        )
        return invitation

    def list(self, current_user: User) -> list[Invitation]:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            return self.repository.list_all()
        return self.repository.list_for_user(current_user.id)

    def get(self, invitation_id: int, current_user: User) -> Invitation:
        self._ensure_active_user(current_user)
        invitation = self.repository.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")
        self._ensure_invitation_access(invitation, current_user)
        return invitation

    def accept(
        self,
        invitation_id: int,
        invitation_accept: InvitationAccept,
        current_user: User,
    ) -> Invitation:
        self._ensure_active_user(current_user)
        invitation = self.repository.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")
        if invitation.token != invitation_accept.token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invitation token.")
        if invitation.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation is not pending.")
        if self._as_aware_utc(invitation.expires_at) < datetime.now(timezone.utc):
            self.repository.update_status(invitation, "expired")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired.")
        if current_user.email.lower() != invitation.email.lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation email does not match user.")

        self.repository.add_memberships(invitation, current_user.id)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="invitation.accepted",
            description=f"Invitation for {invitation.email} was accepted.",
        )
        return invitation

    def revoke(self, invitation_id: int, current_user: User) -> Invitation:
        invitation = self.get(invitation_id, current_user)
        if invitation.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending invitations can be revoked.")
        invitation = self.repository.update_status(invitation, "revoked")
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="invitation.revoked",
            description=f"Invitation for {invitation.email} was revoked.",
        )
        return invitation

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _ensure_invitation_access(self, invitation: Invitation, user: User) -> None:
        if user.is_superuser:
            return
        if invitation.workspace_id is not None:
            self._ensure_workspace_access(invitation.workspace_id, user)
            return
        self._ensure_organization_access(invitation.organization_id, user)

    def _ensure_organization_access(self, organization_id: int, user: User) -> None:
        organization = self.repository.get_organization(organization_id)
        if organization is None or not organization.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        if user.is_superuser or organization.created_by_id == user.id:
            return
        if self.repository.is_organization_member(organization_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invitation access.")

    def _ensure_workspace_access(self, workspace_id: int, user: User) -> None:
        workspace = self.repository.get_workspace(workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        if user.is_superuser or workspace.created_by_id == user.id:
            return
        if self.repository.is_workspace_member(workspace_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invitation access.")

    def _as_aware_utc(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
