from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import OrganizationMember
from app.models.role import Role
from app.models.user import User, UserRole
from app.models.workspace import WorkspaceMember
from app.repositories.invitation_repository import InvitationRepository
from app.schemas.organization import OrganizationMemberUpdate
from app.schemas.workspace import WorkspaceMemberUpdate
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
        self._ensure_not_last_owner(
            members=self._list_organization_members(organization_id),
            target_member=member,
            current_user=current_user,
            scope_name="organization",
        )
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
        self._ensure_not_last_owner(
            members=self._list_workspace_members(workspace_id),
            target_member=member,
            current_user=current_user,
            scope_name="workspace",
        )
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

    def update_organization_member(
        self,
        organization_id: int,
        user_id: int,
        member_update: OrganizationMemberUpdate,
        current_user: User,
    ) -> OrganizationMember:
        self._ensure_active_user(current_user)
        self._ensure_organization_access(organization_id, current_user)
        member = self._get_organization_member(organization_id, user_id)
        next_role = self._member_role_from_update(member_update.role_id, member_update.member_role, member.member_role, current_user)
        if self._is_owner(member) and next_role != "owner":
            self._ensure_not_last_owner(
                members=self._list_organization_members(organization_id),
                target_member=member,
                current_user=current_user,
                scope_name="organization",
            )
        member.role_id = member_update.role_id
        member.member_role = next_role
        self.db.commit()
        self.db.refresh(member)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization_id,
            entity_type="organization_member",
            entity_id=str(user_id),
            action="member.role_changed",
            description=f"User {user_id} role was changed to {member.member_role}.",
        )
        return member

    def update_workspace_member(
        self,
        workspace_id: int,
        user_id: int,
        member_update: WorkspaceMemberUpdate,
        current_user: User,
    ) -> WorkspaceMember:
        self._ensure_active_user(current_user)
        self._ensure_workspace_access(workspace_id, current_user)
        member = self._get_workspace_member(workspace_id, user_id)
        next_role = self._member_role_from_update(member_update.role_id, member_update.member_role, member.member_role, current_user)
        if self._is_owner(member) and next_role != "owner":
            self._ensure_not_last_owner(
                members=self._list_workspace_members(workspace_id),
                target_member=member,
                current_user=current_user,
                scope_name="workspace",
            )
        member.role_id = member_update.role_id
        member.member_role = next_role
        self.db.commit()
        self.db.refresh(member)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            workspace_id=workspace_id,
            entity_type="workspace_member",
            entity_id=str(user_id),
            action="member.role_changed",
            description=f"User {user_id} role was changed to {member.member_role}.",
        )
        return member

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

    def _list_organization_members(self, organization_id: int) -> list[OrganizationMember]:
        return (
            self.db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == organization_id)
            .all()
        )

    def _list_workspace_members(self, workspace_id: int) -> list[WorkspaceMember]:
        return (
            self.db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id)
            .all()
        )

    def _member_role_from_update(
        self,
        role_id: int | None,
        member_role: str | None,
        current_member_role: str,
        current_user: User,
    ) -> str:
        if member_role:
            return member_role.strip().lower()
        if role_id:
            role = self.db.get(Role, role_id)
            if role is None or not role.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
            if role.scope == "platform" and not self._can_assign_platform_role(current_user):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only platform owners or admins can assign platform roles.")
            return (role.key or role.name).strip().lower().replace(" ", "_")
        return current_member_role

    def _can_assign_platform_role(self, current_user: User) -> bool:
        if current_user.is_superuser:
            return True
        platform_role = (
            self.db.query(UserRole)
            .join(Role, Role.id == UserRole.role_id)
            .filter(
                UserRole.user_id == current_user.id,
                Role.key.in_(["platform_owner", "platform_admin"]),
                Role.is_active.is_(True),
            )
            .first()
        )
        return platform_role is not None

    def _is_owner(self, member: OrganizationMember | WorkspaceMember) -> bool:
        if member.member_role.lower() in {"owner", "organization_owner", "platform_owner"}:
            return True
        if member.role_id is None:
            return False
        role = self.db.get(Role, member.role_id)
        return bool(role and role.is_active and role.key.lower() in {"owner", "organization_owner", "platform_owner"})

    def _ensure_not_last_owner(
        self,
        *,
        members: list[OrganizationMember] | list[WorkspaceMember],
        target_member: OrganizationMember | WorkspaceMember,
        current_user: User,
        scope_name: str,
    ) -> None:
        owner_members = [member for member in members if self._is_owner(member)]
        if len(owner_members) > 1 or not self._is_owner(target_member):
            return
        if target_member.user_id == current_user.id:
            detail = f"You cannot remove or downgrade yourself as the only {scope_name} owner."
        else:
            detail = f"You cannot remove or downgrade the last {scope_name} owner."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
