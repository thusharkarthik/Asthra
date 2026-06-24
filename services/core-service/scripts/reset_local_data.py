from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.db.session import SessionLocal, engine  # noqa: E402
from app.models.activity_log import ActivityLog  # noqa: E402
from app.models.api_key import APIKey  # noqa: E402
from app.models.dashboard_summary import ProjectSummary, WorkspaceSummary  # noqa: E402
from app.models.invitation import Invitation  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.organization import Organization, OrganizationMember  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.project import Project, ProjectMembership, ProjectTeam  # noqa: E402
from app.models.role import Role, RolePermission  # noqa: E402
from app.models.team import Team, TeamMember  # noqa: E402
from app.models.user import RoleAssignment, User, UserRole  # noqa: E402
from app.models.workspace import Workspace, WorkspaceMember  # noqa: E402
from app.services.access_control_bootstrap import initialize_access_control  # noqa: E402


PRODUCTION_NAMES = {"prod", "production"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reset local Asthra core-service data without deleting RBAC catalog metadata.")
    parser.add_argument("--yes", action="store_true", help="Confirm destructive local data reset.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    if environment in PRODUCTION_NAMES:
        print("Refusing to reset data when ENVIRONMENT is production.", file=sys.stderr)
        return 2
    if not args.yes:
        print("Refusing to reset local data without --yes.", file=sys.stderr)
        return 2

    with SessionLocal() as db:
        initialize_access_control(engine, db)
        deleted_counts: dict[str, int] = {}
        for label, model in (
            ("activity_logs", ActivityLog),
            ("notifications", Notification),
            ("invitations", Invitation),
            ("api_keys", APIKey),
            ("project_summaries", ProjectSummary),
            ("workspace_summaries", WorkspaceSummary),
            ("team_members", TeamMember),
            ("project_teams", ProjectTeam),
            ("project_memberships", ProjectMembership),
            ("workspace_members", WorkspaceMember),
            ("organization_members", OrganizationMember),
            ("role_assignments", RoleAssignment),
            ("user_roles", UserRole),
            ("projects", Project),
            ("teams", Team),
            ("workspaces", Workspace),
            ("organizations", Organization),
            ("users", User),
        ):
            deleted_counts[label] = db.query(model).delete(synchronize_session=False)
        db.commit()
        initialize_access_control(engine, db)

        kept_roles = db.query(Role).count()
        kept_permissions = db.query(Permission).count()
        kept_role_permissions = db.query(RolePermission).count()
        post_counts = {
            "users": db.query(User).count(),
            "role_assignments": db.query(RoleAssignment).count(),
            "organizations": db.query(Organization).count(),
            "workspaces": db.query(Workspace).count(),
            "projects": db.query(Project).count(),
            "teams": db.query(Team).count(),
        }

    print("Local core-service data reset. System roles and permissions were preserved/reseeded.")
    print(f"Users deleted: {deleted_counts['users']}")
    print(f"Role assignments deleted: {deleted_counts['role_assignments']}")
    print(
        "Organization/workspace/project/team records deleted: "
        f"{deleted_counts['organizations']}/{deleted_counts['workspaces']}/{deleted_counts['projects']}/{deleted_counts['teams']}"
    )
    print(f"Roles kept/reseeded: {kept_roles}")
    print(f"Permissions kept/reseeded: {kept_permissions}")
    print(f"Role-permission mappings kept/reseeded: {kept_role_permissions}")
    print(
        "Post-reset counts: "
        f"users={post_counts['users']}, "
        f"role_assignments={post_counts['role_assignments']}, "
        f"organizations={post_counts['organizations']}, "
        f"workspaces={post_counts['workspaces']}, "
        f"projects={post_counts['projects']}, "
        f"teams={post_counts['teams']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
