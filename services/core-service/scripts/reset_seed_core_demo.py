from __future__ import annotations

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.models.organization import OrganizationMember  # noqa: E402
from app.models.project import ProjectMembership  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.team import Team, TeamMember  # noqa: E402
from app.models.user import RoleAssignment, User, UserRole  # noqa: E402
from app.models.workspace import WorkspaceMember  # noqa: E402
from app.schemas.organization import OrganizationCreate  # noqa: E402
from app.schemas.project import ProjectCreate  # noqa: E402
from app.schemas.workspace import WorkspaceCreate  # noqa: E402
from app.services.organization_service import OrganizationService  # noqa: E402
from app.services.project_service import ProjectService  # noqa: E402
from app.services.role_service import RoleService  # noqa: E402
from app.services.workspace_service import WorkspaceService  # noqa: E402


ADMIN_EMAIL = os.getenv("DEMO_ADMIN_EMAIL", "admin@admin.com")
ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD", "Admin123!")
ADMIN_NAME = os.getenv("DEMO_ADMIN_NAME", "Asthra Admin")
ORGANIZATION_NAME = os.getenv("DEMO_ORGANIZATION_NAME", "Asthra Labs")
WORKSPACE_NAME = os.getenv("DEMO_WORKSPACE_NAME", "Engineering")
PROJECT_NAME = os.getenv("DEMO_PROJECT_NAME", "Asthra Platform")


def _role_by_key(db, key: str) -> Role:
    role = db.query(Role).filter(Role.key == key, Role.is_active.is_(True)).first()
    if role is None:
        raise RuntimeError(f"Expected role seed missing: {key}")
    return role


def _create_user(db, *, email: str, full_name: str, job_title: str, password: str = "Password123!") -> User:
    user = User(
        email=email.lower(),
        full_name=full_name,
        job_title=job_title,
        hashed_password=hash_password(password),
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _add_org_member(db, *, organization_id: int, user_id: int, role: Role) -> None:
    db.add(OrganizationMember(organization_id=organization_id, user_id=user_id, role_id=role.id, member_role=role.key))


def _add_workspace_member(db, *, workspace_id: int, user_id: int, role: Role) -> None:
    db.add(WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role_id=role.id, member_role=role.key))


def _assign_role(db, *, user_id: int, role: Role, scope_type: str, scope_id: int | None, assigned_by: int) -> None:
    db.add(
        RoleAssignment(
            user_id=user_id,
            role_id=role.id,
            scope_type=scope_type,
            scope_id=scope_id,
            status="active",
            assigned_by=assigned_by,
            assigned_at=datetime.now(timezone.utc),
        )
    )


def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin = User(
            email=ADMIN_EMAIL.lower(),
            full_name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        RoleService(db).ensure_role_catalog()
        platform_owner = _role_by_key(db, "platform_owner")
        if db.query(UserRole).filter(UserRole.user_id == admin.id, UserRole.role_id == platform_owner.id).first() is None:
            db.add(UserRole(user_id=admin.id, role_id=platform_owner.id))
            db.commit()

        organization = OrganizationService(db).create(
            OrganizationCreate(name=ORGANIZATION_NAME, description="Demo organization for Asthra internal alpha testing."),
            admin,
        )
        workspace = WorkspaceService(db).create(
            WorkspaceCreate(organization_id=organization.id, name=WORKSPACE_NAME, description="Demo workspace for product and engineering workflows."),
            admin,
        )
        project = ProjectService(db).create(
            ProjectCreate(workspace_id=workspace.id, name=PROJECT_NAME, description="Demo project connected to Flow seed data.", owner_id=admin.id),
            admin,
        )
        flow_project = ProjectService(db).create(
            ProjectCreate(workspace_id=workspace.id, name="Asthra Flow", description="Flow product and execution management project.", owner_id=admin.id),
            admin,
        )
        docs_project = ProjectService(db).create(
            ProjectCreate(workspace_id=workspace.id, name="Asthra Docs", description="Knowledge management and documentation project.", owner_id=admin.id),
            admin,
        )

        john = _create_user(db, email="john@asthra.local", full_name="John Workspace", job_title="Workspace Admin")
        sarah = _create_user(db, email="sarah@asthra.local", full_name="Sarah Product", job_title="Project Manager")
        mike = _create_user(db, email="mike@asthra.local", full_name="Mike Contributor", job_title="Engineer")
        priya = _create_user(db, email="priya@asthra.local", full_name="Priya Lead", job_title="Team Lead")

        organization_owner = _role_by_key(db, "organization_owner")
        workspace_admin = _role_by_key(db, "workspace_admin")
        project_manager = _role_by_key(db, "project_manager")
        project_contributor = _role_by_key(db, "project_contributor")
        team_lead = _role_by_key(db, "team_lead")
        team_member = _role_by_key(db, "team_member")
        organization_member = (
            db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == admin.id)
            .first()
        )
        if organization_member is not None:
            organization_member.role_id = organization_owner.id
            organization_member.member_role = organization_owner.key
        workspace_member = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == admin.id)
            .first()
        )
        if workspace_member is not None:
            workspace_member.role_id = workspace_admin.id
            workspace_member.member_role = workspace_admin.key

        for user, org_role, workspace_role in [
            (john, organization_owner, workspace_admin),
            (sarah, organization_owner, workspace_admin),
            (mike, organization_owner, workspace_admin),
            (priya, organization_owner, workspace_admin),
        ]:
            _add_org_member(db, organization_id=organization.id, user_id=user.id, role=org_role)
            _add_workspace_member(db, workspace_id=workspace.id, user_id=user.id, role=workspace_role)

        backend_team = Team(workspace_id=workspace.id, name="Backend Team", description="Core APIs and platform services.", slug="backend-team", created_by_id=admin.id)
        frontend_team = Team(workspace_id=workspace.id, name="Frontend Team", description="Asthra web application and UX.", slug="frontend-team", created_by_id=admin.id)
        platform_team = Team(workspace_id=workspace.id, name="Platform Team", description="Shared platform foundations and operations.", slug="platform-team", created_by_id=admin.id)
        db.add_all([backend_team, frontend_team, platform_team])
        db.commit()
        db.refresh(backend_team)
        db.refresh(frontend_team)
        db.refresh(platform_team)

        now = datetime.now(timezone.utc)
        db.add_all([
            ProjectMembership(project_id=project.id, user_id=sarah.id, role_id=project_manager.id, team_id=platform_team.id, status="active", joined_at=now),
            ProjectMembership(project_id=flow_project.id, user_id=mike.id, role_id=project_contributor.id, team_id=backend_team.id, status="active", joined_at=now),
            ProjectMembership(project_id=docs_project.id, user_id=priya.id, role_id=project_manager.id, team_id=frontend_team.id, status="active", joined_at=now),
            TeamMember(team_id=backend_team.id, user_id=priya.id, role_id=team_lead.id, member_role=team_lead.key, status="active", joined_at=now),
            TeamMember(team_id=backend_team.id, user_id=mike.id, role_id=team_member.id, member_role=team_member.key, status="active", joined_at=now),
            TeamMember(team_id=frontend_team.id, user_id=sarah.id, role_id=team_member.id, member_role=team_member.key, status="active", joined_at=now),
        ])

        _assign_role(db, user_id=admin.id, role=platform_owner, scope_type="platform", scope_id=None, assigned_by=admin.id)
        _assign_role(db, user_id=john.id, role=workspace_admin, scope_type="workspace", scope_id=workspace.id, assigned_by=admin.id)
        _assign_role(db, user_id=sarah.id, role=project_manager, scope_type="project", scope_id=project.id, assigned_by=admin.id)
        _assign_role(db, user_id=mike.id, role=project_contributor, scope_type="project", scope_id=flow_project.id, assigned_by=admin.id)
        _assign_role(db, user_id=priya.id, role=team_lead, scope_type="team", scope_id=backend_team.id, assigned_by=admin.id)
        db.commit()

        print("Reset core-service database and seeded demo admin/context.")
        print(f"Admin email: {ADMIN_EMAIL}")
        print(f"Admin password: {ADMIN_PASSWORD}")
        print(f"User ID: {admin.id}")
        print(f"Organization ID: {organization.id}")
        print(f"Workspace ID: {workspace.id}")
        print(f"Project ID: {project.id}")
        print(f"Flow Project ID: {flow_project.id}")
        print(f"Docs Project ID: {docs_project.id}")
        print(f"Teams: {backend_team.name}, {frontend_team.name}, {platform_team.name}")
        print("Demo users: john@asthra.local, sarah@asthra.local, mike@asthra.local, priya@asthra.local")
        print("Role: Platform Owner")
    finally:
        db.close()


if __name__ == "__main__":
    main()
