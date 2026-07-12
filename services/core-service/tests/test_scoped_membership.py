from app.db.session import SessionLocal
from app.models.organization import OrganizationMember
from app.models.permission import Permission
from app.models.project import ProjectMembership
from app.models.role import Role, RolePermission
from app.models.team import Team, TeamMember
from app.models.user import RoleAssignment, User
from app.models.workspace import WorkspaceMember
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate
from app.schemas.scoped_membership import RoleAssignmentCreate
from app.schemas.workspace import WorkspaceCreate
from app.services.access_control_service import AccessControlService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.role_service import RoleService
from app.services.membership_service import MembershipService
from app.services.scoped_membership_service import ScopedMembershipService
from app.services.workspace_service import WorkspaceService


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


def _role(db, key: str) -> Role:
    role = db.query(Role).filter(Role.key == key).first()
    assert role is not None
    return role


def test_workspace_role_assignment_inherits_to_project():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-scoped@example.com", superuser=True)
        user = _create_user(db, "john-scoped@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Scoped Org"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), admin)
        project = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Platform"), admin)
        RoleService(db).ensure_role_catalog()

        workspace_admin = _role(db, "workspace_admin")
        db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role_id=workspace_admin.id, member_role=workspace_admin.key))
        db.add(RoleAssignment(user_id=user.id, role_id=workspace_admin.id, scope_type="workspace", scope_id=workspace.id, status="active"))
        db.commit()

        permissions = AccessControlService(db).get_effective_permissions(user.id, "project", project.id)

        assert "settings.project.manage" in permissions
        assert "settings.member.invite" in permissions
    finally:
        db.close()


def test_project_role_does_not_apply_to_unrelated_project():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-project-scope@example.com", superuser=True)
        user = _create_user(db, "sarah-project-scope@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Project Scope Org"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), admin)
        project_one = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Asthra Platform"), admin)
        project_two = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Asthra Docs"), admin)
        RoleService(db).ensure_role_catalog()

        project_manager = _role(db, "project_manager")
        db.add(RoleAssignment(user_id=user.id, role_id=project_manager.id, scope_type="project", scope_id=project_one.id, status="active"))
        db.add(ProjectMembership(project_id=project_one.id, user_id=user.id, role_id=project_manager.id, status="active"))
        db.commit()

        project_one_permissions = AccessControlService(db).get_effective_permissions(user.id, "project", project_one.id)
        project_two_permissions = AccessControlService(db).get_effective_permissions(user.id, "project", project_two.id)

        assert "flow.work_item.edit" in project_one_permissions
        assert "flow.work_item.edit" not in project_two_permissions
    finally:
        db.close()


def test_direct_org_role_assignment_creates_org_member():
    """BUG-040: Assigning an org-scoped role directly must create an OrganizationMember record."""
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-bug040-org@example.com", superuser=True)
        user = _create_user(db, "user-bug040-org@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Bug040 Org"), admin)
        RoleService(db).ensure_role_catalog()
        org_admin = _role(db, "organization_admin")

        ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(
                user_id=user.id,
                role_id=org_admin.id,
                scope_type="organization",
                scope_id=organization.id,
            ),
            admin,
        )

        org_member = (
            db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id)
            .first()
        )
        assert org_member is not None, "OrganizationMember must be created on direct role assignment"

        user_orgs = OrganizationService(db).list(user)
        org_ids = [o.id for o in user_orgs]
        assert organization.id in org_ids, "Org must appear in list() after direct role assignment"
    finally:
        db.close()


def test_removing_last_ordinary_org_role_revokes_assignment_and_removes_membership():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-remove-last-org-role@example.com", superuser=True)
        user = _create_user(db, "user-remove-last-org-role@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Remove Last Org Role"), admin)
        RoleService(db).ensure_role_catalog()
        org_admin = _role(db, "organization_admin")

        assignment = ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(
                user_id=user.id,
                role_id=org_admin.id,
                scope_type="organization",
                scope_id=organization.id,
            ),
            admin,
        )

        ScopedMembershipService(db).delete_role_assignment(assignment.id, admin)

        db.refresh(assignment)
        assert assignment.status == "revoked"
        assert (
            db.query(RoleAssignment)
            .filter(RoleAssignment.user_id == user.id, RoleAssignment.scope_type == "organization", RoleAssignment.scope_id == organization.id, RoleAssignment.status == "active")
            .first()
            is None
        )
        assert (
            db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id)
            .first()
            is None
        )
        permissions = AccessControlService(db).get_effective_permissions(user.id, "organization", organization.id)
        assert "settings.organization.manage" not in permissions
    finally:
        db.close()


def test_removing_last_workspace_role_removes_workspace_membership_without_fallback():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-remove-last-workspace-role@example.com", superuser=True)
        user = _create_user(db, "user-remove-last-workspace-role@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Remove Last Workspace Role"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), admin)
        RoleService(db).ensure_role_catalog()
        workspace_admin = _role(db, "workspace_admin")

        assignment = ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(
                user_id=user.id,
                role_id=workspace_admin.id,
                scope_type="workspace",
                scope_id=workspace.id,
            ),
            admin,
        )

        ScopedMembershipService(db).delete_role_assignment(assignment.id, admin)

        db.refresh(assignment)
        assert assignment.status == "revoked"
        assert (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
            .first()
            is None
        )
        assert (
            db.query(RoleAssignment)
            .filter(RoleAssignment.user_id == user.id, RoleAssignment.scope_type == "workspace", RoleAssignment.scope_id == workspace.id, RoleAssignment.status == "active")
            .first()
            is None
        )
    finally:
        db.close()


def test_remove_organization_member_revokes_org_and_child_workspace_access():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-remove-org-member@example.com", superuser=True)
        user = _create_user(db, "user-remove-org-member@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Remove Org Member"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), admin)
        RoleService(db).ensure_role_catalog()

        ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(user_id=user.id, role_id=_role(db, "organization_admin").id, scope_type="organization", scope_id=organization.id),
            admin,
        )
        ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(user_id=user.id, role_id=_role(db, "workspace_admin").id, scope_type="workspace", scope_id=workspace.id),
            admin,
        )

        MembershipService(db).remove_organization_member(organization.id, user.id, admin)

        assert db.query(OrganizationMember).filter(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id).first() is None
        assert db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id).first() is None
        assert (
            db.query(RoleAssignment)
            .filter(RoleAssignment.user_id == user.id, RoleAssignment.status == "active", RoleAssignment.scope_type.in_(["organization", "workspace"]))
            .first()
            is None
        )
    finally:
        db.close()


def test_effective_permissions_are_union_of_active_role_assignments():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-union-perms@example.com", superuser=True)
        user = _create_user(db, "user-union-perms@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Union Permissions Org"), admin)
        role_a = Role(name="Union Alpha", key="union_alpha", scope="organization", is_system=False, is_editable=True, is_active=True)
        role_b = Role(name="Union Beta", key="union_beta", scope="organization", is_system=False, is_editable=True, is_active=True)
        permission_a = Permission(key="custom.alpha.view", code="custom.alpha.view", name="Alpha View", module="custom", resource="alpha", action="view", scope="organization")
        permission_b = Permission(key="custom.beta.view", code="custom.beta.view", name="Beta View", module="custom", resource="beta", action="view", scope="organization")
        db.add_all([role_a, role_b, permission_a, permission_b])
        db.commit()
        db.refresh(role_a)
        db.refresh(role_b)
        db.refresh(permission_a)
        db.refresh(permission_b)
        db.add_all([
            RolePermission(role_id=role_a.id, permission_id=permission_a.id),
            RolePermission(role_id=role_b.id, permission_id=permission_b.id),
        ])
        db.commit()

        assignment_a = ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(user_id=user.id, role_id=role_a.id, scope_type="organization", scope_id=organization.id),
            admin,
        )
        assignment_b = ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(user_id=user.id, role_id=role_b.id, scope_type="organization", scope_id=organization.id),
            admin,
        )

        permissions = AccessControlService(db).get_effective_permissions(user.id, "organization", organization.id)
        assert "custom.alpha.view" in permissions
        assert "custom.beta.view" in permissions

        ScopedMembershipService(db).delete_role_assignment(assignment_a.id, admin)
        permissions_after_one_removal = AccessControlService(db).get_effective_permissions(user.id, "organization", organization.id)
        assert "custom.alpha.view" not in permissions_after_one_removal
        assert "custom.beta.view" in permissions_after_one_removal

        ScopedMembershipService(db).delete_role_assignment(assignment_b.id, admin)
        permissions_after_all_removed = AccessControlService(db).get_effective_permissions(user.id, "organization", organization.id)
        assert "custom.alpha.view" not in permissions_after_all_removed
        assert "custom.beta.view" not in permissions_after_all_removed
    finally:
        db.close()


def test_direct_workspace_role_assignment_creates_workspace_and_org_member():
    """BUG-040: Assigning a workspace-scoped role must create WorkspaceMember and OrganizationMember."""
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-bug040-ws@example.com", superuser=True)
        user = _create_user(db, "user-bug040-ws@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Bug040 Workspace Org"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Bug040 WS"), admin)
        RoleService(db).ensure_role_catalog()
        ws_admin = _role(db, "workspace_admin")

        ScopedMembershipService(db).create_role_assignment(
            RoleAssignmentCreate(
                user_id=user.id,
                role_id=ws_admin.id,
                scope_type="workspace",
                scope_id=workspace.id,
            ),
            admin,
        )

        ws_member = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
            .first()
        )
        assert ws_member is not None, "WorkspaceMember must be created on direct workspace role assignment"

        org_member = (
            db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id)
            .first()
        )
        assert org_member is not None, "OrganizationMember must be created for the workspace's org"

        user_orgs = OrganizationService(db).list(user)
        org_ids = [o.id for o in user_orgs]
        assert organization.id in org_ids, "Org must appear in list() after direct workspace role assignment"
    finally:
        db.close()


def test_project_and_team_membership_models_store_roles():
    db = SessionLocal()
    try:
        admin = _create_user(db, "admin-membership@example.com", superuser=True)
        user = _create_user(db, "priya-membership@example.com")
        organization = OrganizationService(db).create(OrganizationCreate(name="Membership Org"), admin)
        workspace = WorkspaceService(db).create(WorkspaceCreate(organization_id=organization.id, name="Engineering"), admin)
        project = ProjectService(db).create(ProjectCreate(workspace_id=workspace.id, name="Asthra Flow"), admin)
        RoleService(db).ensure_role_catalog()
        team_lead = _role(db, "team_lead")
        project_contributor = _role(db, "project_contributor")
        team = Team(workspace_id=workspace.id, name="Backend Team", slug="backend-team", description="Backend", created_by_id=admin.id)
        db.add(team)
        db.commit()
        db.refresh(team)

        db.add(ProjectMembership(project_id=project.id, user_id=user.id, role_id=project_contributor.id, team_id=team.id, status="active"))
        db.add(TeamMember(team_id=team.id, user_id=user.id, role_id=team_lead.id, member_role=team_lead.key, status="active"))
        db.commit()

        assert db.query(ProjectMembership).filter_by(project_id=project.id, user_id=user.id).first().role_id == project_contributor.id
        assert db.query(TeamMember).filter_by(team_id=team.id, user_id=user.id).first().role_id == team_lead.id
    finally:
        db.close()
