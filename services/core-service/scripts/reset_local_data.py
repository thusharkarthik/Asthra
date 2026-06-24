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
from app.models.project import Project, ProjectMembership, ProjectTeam  # noqa: E402
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
        for model in (
            ActivityLog,
            Notification,
            Invitation,
            APIKey,
            ProjectSummary,
            WorkspaceSummary,
            TeamMember,
            ProjectTeam,
            ProjectMembership,
            WorkspaceMember,
            OrganizationMember,
            RoleAssignment,
            UserRole,
            Project,
            Team,
            Workspace,
            Organization,
            User,
        ):
            db.query(model).delete(synchronize_session=False)
        db.commit()
        initialize_access_control(engine, db)

    print("Local core-service data reset. System roles and permissions were preserved/reseeded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
