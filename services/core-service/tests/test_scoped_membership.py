from app.db.session import SessionLocal
from app.models.project import ProjectMembership
from app.models.role import Role
from app.models.team import Team, TeamMember
from app.models.user import RoleAssignment, User
from app.models.workspace import WorkspaceMember
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate
from app.schemas.workspace import WorkspaceCreate
from app.services.access_control_service import AccessControlService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.role_service import RoleService
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
