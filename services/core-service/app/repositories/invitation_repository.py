from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.organization import Organization, OrganizationMember
from app.models.user import RoleAssignment, User
from app.models.workspace import Workspace, WorkspaceMember


class InvitationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, invitation_id: int) -> Invitation | None:
        return self.db.get(Invitation, invitation_id)

    def get_pending_duplicate(
        self,
        *,
        email: str,
        organization_id: int | None,
        workspace_id: int | None,
    ) -> Invitation | None:
        statement = select(Invitation).where(
            Invitation.email == email,
            Invitation.workspace_id == workspace_id,
            Invitation.status == "pending",
        )
        if organization_id is None:
            statement = statement.where(Invitation.organization_id.is_(None))
        else:
            statement = statement.where(Invitation.organization_id == organization_id)
        return self.db.scalar(statement)

    def get_duplicate_by_status(
        self,
        *,
        email: str,
        organization_id: int | None,
        workspace_id: int | None,
        status: str,
        exclude_id: int | None = None,
    ) -> Invitation | None:
        statement = select(Invitation).where(
            Invitation.email == email,
            Invitation.workspace_id == workspace_id,
            Invitation.status == status,
        )
        if organization_id is None:
            statement = statement.where(Invitation.organization_id.is_(None))
        else:
            statement = statement.where(Invitation.organization_id == organization_id)
        if exclude_id is not None:
            statement = statement.where(Invitation.id != exclude_id)
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int) -> list[Invitation]:
        statement = (
            select(Invitation)
            .join(OrganizationMember, OrganizationMember.organization_id == Invitation.organization_id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(Invitation.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_all(self) -> list[Invitation]:
        statement = select(Invitation).order_by(Invitation.created_at.desc())
        return list(self.db.scalars(statement).all())

    def get_organization(self, organization_id: int) -> Organization | None:
        return self.db.get(Organization, organization_id)

    def get_workspace(self, workspace_id: int) -> Workspace | None:
        return self.db.get(Workspace, workspace_id)

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.db.scalar(statement)

    def is_organization_member(self, organization_id: int, user_id: int) -> bool:
        statement = select(OrganizationMember.id).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def is_workspace_member(self, workspace_id: int, user_id: int) -> bool:
        statement = select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def create(
        self,
        *,
        email: str,
        organization_id: int | None,
        workspace_id: int | None,
        invited_by_id: int,
        role_id: int | None,
        token: str,
        expires_at: datetime,
    ) -> Invitation:
        invitation = Invitation(
            email=email,
            organization_id=organization_id,
            workspace_id=workspace_id,
            invited_by_id=invited_by_id,
            role_id=role_id,
            status="pending",
            token=token,
            expires_at=expires_at,
        )
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        return invitation

    def update_status(self, invitation: Invitation, status: str) -> Invitation:
        invitation.status = status
        self.db.commit()
        self.db.refresh(invitation)
        return invitation

    def delete(self, invitation: Invitation) -> None:
        self.db.delete(invitation)
        self.db.flush()

    def add_memberships(self, invitation: Invitation, user_id: int) -> None:
        if invitation.organization_id is not None and not self.is_organization_member(invitation.organization_id, user_id):
            self.db.add(
                OrganizationMember(
                    organization_id=invitation.organization_id,
                    user_id=user_id,
                    member_role="member",
                )
            )
        if invitation.workspace_id is not None and not self.is_workspace_member(invitation.workspace_id, user_id):
            self.db.add(
                WorkspaceMember(
                    workspace_id=invitation.workspace_id,
                    user_id=user_id,
                    member_role="member",
                )
            )
        if invitation.role_id is not None:
            scope_type = "workspace" if invitation.workspace_id is not None else "organization"
            scope_id = invitation.workspace_id if invitation.workspace_id is not None else invitation.organization_id
            if scope_id is not None:
                existing = (
                    self.db.query(RoleAssignment)
                    .filter(
                        RoleAssignment.user_id == user_id,
                        RoleAssignment.role_id == invitation.role_id,
                        RoleAssignment.scope_type == scope_type,
                        RoleAssignment.scope_id == scope_id,
                        RoleAssignment.status == "active",
                    )
                    .first()
                )
                if existing is None:
                    self.db.add(RoleAssignment(
                        user_id=user_id,
                        role_id=invitation.role_id,
                        scope_type=scope_type,
                        scope_id=scope_id,
                        status="active",
                        assigned_by=invitation.invited_by_id,
                        assigned_at=datetime.now(timezone.utc),
                    ))
        invitation.status = "accepted"
        self.db.commit()
        self.db.refresh(invitation)
