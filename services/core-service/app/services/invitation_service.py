from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.repositories.invitation_repository import InvitationRepository
from app.schemas.invitation import InvitationAccept, InvitationCreate
from app.services.access_control_service import AccessControlService
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.notification_service import NotificationService


class InvitationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = InvitationRepository(db)

    def create(self, invitation_create: InvitationCreate, current_user: User) -> Invitation:
        self._ensure_active_user(current_user)
        email = invitation_create.email.lower()
        organization_id = invitation_create.organization_id

        if organization_id is None:
            permission_scope_type = "platform"
            permission_scope_id = None
        else:
            organization = self.repository.get_organization(organization_id)
            if organization is None or not organization.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            permission_scope_type = "organization"
            permission_scope_id = organization_id

            if invitation_create.workspace_id is not None:
                workspace = self.repository.get_workspace(invitation_create.workspace_id)
                if workspace is None or not workspace.is_active:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
                if workspace.organization_id != organization_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Workspace does not belong to this organization.",
                    )
                self._ensure_workspace_access(invitation_create.workspace_id, current_user)
                permission_scope_type = "workspace"
                permission_scope_id = invitation_create.workspace_id
            else:
                self._ensure_organization_access(organization_id, current_user)

        AccessControlService(self.db).require(
            current_user,
            "settings.member.invite",
            permission_scope_type,
            permission_scope_id,
        )

        pending_duplicate = self.repository.get_pending_duplicate(
            email=email,
            organization_id=organization_id,
            workspace_id=invitation_create.workspace_id,
        )
        if pending_duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending invitation already exists for this email and scope. Use resend to extend it.",
            )

        invited_user = self.repository.get_user_by_email(email)
        self._ensure_role_allowed(invitation_create.role_id, current_user)
        if invited_user is not None:
            if organization_id is None:
                already_member = False
            elif invitation_create.workspace_id is not None:
                already_member = self.repository.is_workspace_member(invitation_create.workspace_id, invited_user.id)
            else:
                already_member = self.repository.is_organization_member(organization_id, invited_user.id)
            if already_member:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User is already an active member for this scope.",
                )
            stale_accepted = self.repository.get_duplicate_by_status(
                email=email,
                organization_id=organization_id,
                workspace_id=invitation_create.workspace_id,
                status="accepted",
            )
            if stale_accepted is not None:
                self.repository.delete(stale_accepted)

        invitation = self.repository.create(
            email=email,
            organization_id=organization_id,
            workspace_id=invitation_create.workspace_id,
            invited_by_id=current_user.id,
            role_id=invitation_create.role_id,
            token=token_urlsafe(32),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        if invited_user is not None:
            if organization_id is None:
                self._assign_platform_role(invitation.role_id, invited_user.id, current_user.id)
                invitation.status = "accepted"
            else:
                self.repository.add_memberships(invitation, invited_user.id)
                invitation = self.repository.get_by_id(invitation.id) or invitation
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="member.invited",
            description=f"{actor_name} invited {invitation.email}.",
        )
        if invited_user is not None:
            role = self.db.get(Role, invitation.role_id) if invitation.role_id else None
            role_name = role.name if role else "Member"
            NotificationService(self.db).create_notification(
                user_id=invited_user.id,
                type="invitation.pending",
                title="Asthra invitation",
                message=f"You have been invited to Asthra as {role_name}.",
                organization_id=invitation.organization_id,
                workspace_id=invitation.workspace_id,
                entity_type="invitation",
                entity_id=str(invitation.id),
            )
        ContextVersionService(self.db).bump_access(permission_scope_type, permission_scope_id)
        self.db.commit()
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

        if invitation.organization_id is None:
            self._assign_platform_role(invitation.role_id, current_user.id, invitation.invited_by_id)
            invitation.status = "accepted"
        else:
            self.repository.add_memberships(invitation, current_user.id)

        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="member.invitation_accepted",
            description=f"{actor_name} accepted an invitation.",
        )
        NotificationService(self.db).create_notification(
            user_id=invitation.invited_by_id,
            type="invitation.accepted",
            title="Invitation accepted",
            message=f"{current_user.email} accepted an invitation.",
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
        )
        self._bump_invitation_scope(invitation)
        self.db.commit()
        return invitation

    def accept_in_app(self, invitation_id: int, current_user: User) -> Invitation:
        """Accept a pending invitation from the in-app notification center (no email token required)."""
        self._ensure_active_user(current_user)
        invitation = self.repository.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")
        if invitation.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation is not pending.")
        if self._as_aware_utc(invitation.expires_at) < datetime.now(timezone.utc):
            self.repository.update_status(invitation, "expired")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired.")
        if current_user.email.lower() != invitation.email.lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation email does not match user.")

        if invitation.organization_id is None:
            self._assign_platform_role(invitation.role_id, current_user.id, invitation.invited_by_id)
            invitation.status = "accepted"
        else:
            self.repository.add_memberships(invitation, current_user.id)

        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="member.invitation_accepted",
            description=f"{actor_name} accepted an invitation.",
        )
        NotificationService(self.db).create_notification(
            user_id=invitation.invited_by_id,
            type="invitation.accepted",
            title="Invitation accepted",
            message=f"{current_user.email} accepted an invitation.",
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
        )
        self._bump_invitation_scope(invitation)
        self.db.commit()
        return invitation

    def revoke(self, invitation_id: int, current_user: User) -> Invitation:
        invitation = self.get(invitation_id, current_user)
        self._require_invitation_manage(invitation, current_user, "settings.member.cancel")
        if invitation.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending invitations can be revoked.")
        stale_cancelled = self.repository.get_duplicate_by_status(
            email=invitation.email,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            status="cancelled",
            exclude_id=invitation.id,
        )
        if stale_cancelled is not None:
            self.repository.delete(stale_cancelled)
        invitation = self.repository.update_status(invitation, "cancelled")
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="member.invitation_cancelled",
            description=f"{actor_name} cancelled the invitation for {invitation.email}.",
        )
        self._bump_invitation_scope(invitation)
        self.db.commit()
        return invitation

    def resend(self, invitation_id: int, current_user: User) -> Invitation:
        invitation = self.get(invitation_id, current_user)
        self._require_invitation_manage(invitation, current_user, "settings.member.resend")
        if invitation.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending invitations can be resent.")
        invitation.token = token_urlsafe(32)
        invitation.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=invitation.organization_id,
            workspace_id=invitation.workspace_id,
            entity_type="invitation",
            entity_id=str(invitation.id),
            action="member.invitation_resent",
            description=f"{actor_name} resent the invitation for {invitation.email}.",
        )
        self._bump_invitation_scope(invitation)
        self.db.commit()
        self.db.refresh(invitation)
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
        if invitation.organization_id is not None:
            self._ensure_organization_access(invitation.organization_id, user)
            return
        if not AccessControlService(self.db).can_access_scope(user.id, "platform", None):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invitation access.")

    def _ensure_organization_access(self, organization_id: int, user: User) -> None:
        organization = self.repository.get_organization(organization_id)
        if organization is None or not organization.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
        if user.is_superuser or organization.created_by_id == user.id:
            return
        if self.repository.is_organization_member(organization_id, user.id):
            return
        if AccessControlService(self.db).can_access_scope(user.id, "organization", organization_id):
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
        if AccessControlService(self.db).can_access_scope(user.id, "workspace", workspace_id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invitation access.")

    def _as_aware_utc(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _ensure_role_allowed(self, role_id: int | None, current_user: User) -> None:
        if role_id is None:
            return
        role = self.db.get(Role, role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        if role.scope != "platform" or current_user.is_superuser:
            return
        platform_assignment = (
            self.db.query(RoleAssignment)
            .join(Role, Role.id == RoleAssignment.role_id)
            .filter(
                RoleAssignment.user_id == current_user.id,
                RoleAssignment.scope_type == "platform",
                RoleAssignment.status == "active",
                Role.key.in_(["platform_owner", "platform_admin"]),
                Role.is_active.is_(True),
            )
            .first()
        )
        if platform_assignment is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only platform owners or admins can assign platform roles.")

    def _require_invitation_manage(self, invitation: Invitation, current_user: User, permission_code: str) -> None:
        if invitation.organization_id is None:
            AccessControlService(self.db).require(current_user, permission_code, "platform", None)
            return
        if invitation.workspace_id is not None:
            AccessControlService(self.db).require(current_user, permission_code, "workspace", invitation.workspace_id)
            return
        AccessControlService(self.db).require(current_user, permission_code, "organization", invitation.organization_id)

    def _assign_platform_role(self, role_id: int | None, user_id: int, assigning_user_id: int) -> None:
        if role_id is None:
            return
        existing = (
            self.db.query(RoleAssignment)
            .filter(
                RoleAssignment.user_id == user_id,
                RoleAssignment.role_id == role_id,
                RoleAssignment.scope_type == "platform",
                RoleAssignment.scope_id.is_(None),
                RoleAssignment.status == "active",
            )
            .first()
        )
        if existing is not None:
            return
        self.db.add(RoleAssignment(
            user_id=user_id,
            role_id=role_id,
            scope_type="platform",
            scope_id=None,
            status="active",
            assigned_by=assigning_user_id,
            assigned_at=datetime.now(timezone.utc),
        ))

    def _bump_invitation_scope(self, invitation: Invitation) -> None:
        if invitation.organization_id is None:
            ContextVersionService(self.db).bump_access("platform", None)
        elif invitation.workspace_id is not None:
            ContextVersionService(self.db).bump_access("workspace", invitation.workspace_id)
        else:
            ContextVersionService(self.db).bump_access("organization", invitation.organization_id)
