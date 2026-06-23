import pytest
from fastapi import HTTPException

from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.schemas.invitation import InvitationCreate
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.workspace import WorkspaceCreate
from app.services.access_control_service import AccessControlService
from app.services.invitation_service import InvitationService
from app.services.organization_service import OrganizationService
from app.services.role_service import RoleService
from app.services.workspace_service import WorkspaceService
from app.services.project_service import ProjectService


def _create_user(db, email: str, *, superuser: bool = False) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0].title(),
        hashed_password="test",
        is_active=True,
        is_superuser=superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_organization_owner_inherits_workspace_and_project_permissions():
    db = SessionLocal()
    try:
        user = _create_user(db, "owner@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Asthra Labs"), user)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), user)
        project = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Platform"), user)

        access = AccessControlService(db)
        org_permissions = access.get_user_permissions(user.id, "organization", organization.id)
        workspace_permissions = access.get_user_permissions(user.id, "workspace", workspace.id)
        project_permissions = access.get_user_permissions(user.id, "project", project.id)

        assert "settings.workspace.manage" in org_permissions["permission_codes"]
        assert "settings.project.create" in workspace_permissions["permission_codes"]
        assert "settings.project.edit" in project_permissions["permission_codes"]
        assert "settings.project.restore" in project_permissions["permission_codes"]
        assert "settings.team.edit" in workspace_permissions["permission_codes"]
        assert any(role["key"] == "organization_owner" for role in project_permissions["roles"])
        assert access.can(user.id, "settings.member.invite", "workspace", workspace.id) is True
    finally:
        db.close()


def test_organization_owner_can_manage_archived_project_after_refresh_scope():
    db = SessionLocal()
    try:
        user = _create_user(db, "archive-owner@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Archived Scope Org"), user)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), user)
        project = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Archived Platform"), user)
        archived_project = ProjectService(db).update(project.id, ProjectUpdate(status="archived", is_active=False), user)

        access = AccessControlService(db)
        permissions = access.get_user_permissions(user.id, "project", archived_project.id)

        assert archived_project.workspace.organization_id == organization.id
        assert "settings.project.restore" in permissions["permission_codes"]
        assert any(role["key"] == "organization_owner" for role in permissions["roles"])
        restored_project = ProjectService(db).update(archived_project.id, ProjectUpdate(status="active", is_active=True), user)
        assert restored_project.is_active is True
        assert restored_project.status == "active"
    finally:
        db.close()


def test_user_without_invite_permission_gets_403():
    db = SessionLocal()
    try:
        owner = _create_user(db, "owner2@example.com")
        viewer = _create_user(db, "viewer@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Viewer Org"), owner)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Viewer Workspace"), owner)
        RoleService(db).ensure_role_catalog()
        viewer_role = db.query(Role).filter(Role.key == "workspace_viewer").first()
        db.add(WorkspaceMember(workspace_id=workspace.id, user_id=viewer.id, role_id=viewer_role.id, member_role=viewer_role.key))
        db.commit()

        with pytest.raises(HTTPException) as exc:
            InvitationService(db).create(
                InvitationCreate(
                    email="new-user@example.com",
                    organization_id=organization.id,
                    workspace_id=workspace.id,
                ),
                viewer,
            )

        assert exc.value.status_code == 403
        assert "settings.member.invite" in str(exc.value.detail)
    finally:
        db.close()


def test_user_with_invite_permission_can_invite():
    db = SessionLocal()
    try:
        owner = _create_user(db, "owner3@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Invite Org"), owner)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Invite Workspace"), owner)

        invitation = InvitationService(db).create(
            InvitationCreate(
                email="invited@example.com",
                organization_id=organization.id,
                workspace_id=workspace.id,
            ),
            owner,
        )

        assert invitation.email == "invited@example.com"
        assert invitation.status == "pending"
    finally:
        db.close()
