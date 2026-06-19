from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.models.organization import OrganizationMember  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
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

        organization_owner = _role_by_key(db, "organization_owner")
        workspace_admin = _role_by_key(db, "workspace_admin")
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
        db.commit()

        print("Reset core-service database and seeded demo admin/context.")
        print(f"Admin email: {ADMIN_EMAIL}")
        print(f"Admin password: {ADMIN_PASSWORD}")
        print(f"User ID: {admin.id}")
        print(f"Organization ID: {organization.id}")
        print(f"Workspace ID: {workspace.id}")
        print(f"Project ID: {project.id}")
        print("Role: Platform Owner")
    finally:
        db.close()


if __name__ == "__main__":
    main()
