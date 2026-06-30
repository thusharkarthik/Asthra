from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.context_version import ContextVersionRead, PlatformContextResponse
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.workspace_service import WorkspaceService

router = APIRouter()


@router.get("/version", response_model=ContextVersionRead)
def get_context_version(
    organization_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return ContextVersionService(db).get_version(
        current_user,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
    )


@router.get("/platform", response_model=PlatformContextResponse)
def get_platform_context(
    org_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    # Determine most-specific scope for permission resolution
    scope_type: str | None = None
    scope_id: int | None = None
    if org_id is not None:
        scope_type = "organization"
        scope_id = org_id
    if workspace_id is not None:
        scope_type = "workspace"
        scope_id = workspace_id
    if project_id is not None:
        scope_type = "project"
        scope_id = project_id

    # Permissions
    perms = AccessControlService(db).get_user_permissions(current_user.id, scope_type, scope_id)

    # Organizations (scoped to user access — superusers get all, others get their orgs)
    organizations = OrganizationService(db).list(current_user)

    # Workspaces scoped to org if provided
    workspaces = WorkspaceService(db).list(current_user, organization_id=org_id)

    # Projects scoped to workspace if provided; empty list when no workspace given
    projects = ProjectService(db).list(current_user, workspace_id=workspace_id) if workspace_id else []

    # Context version for cache busting
    version_data = ContextVersionService(db).get_version(
        current_user,
        organization_id=org_id,
        workspace_id=workspace_id,
        project_id=project_id,
    )

    # Resolve current_* from requested scope IDs
    current_org = next((o for o in organizations if o.id == org_id), None) if org_id else None
    current_ws = next((w for w in workspaces if w.id == workspace_id), None) if workspace_id else None
    current_proj = next((p for p in projects if p.id == project_id), None) if project_id else None

    def _org(o: object) -> dict:
        return {
            "id": o.id,
            "name": o.name,
            "slug": o.slug,
            "is_active": o.is_active,
            "description": o.description,
            "settings": o.settings or {},
        }

    def _ws(w: object) -> dict:
        return {
            "id": w.id,
            "name": w.name,
            "slug": w.slug,
            "organization_id": w.organization_id,
            "is_active": w.is_active,
            "description": w.description,
        }

    def _proj(p: object) -> dict:
        return {
            "id": p.id,
            "name": p.name,
            "key": p.key,
            "workspace_id": p.workspace_id,
            "status": p.status or "active",
            "is_active": p.is_active,
            "description": p.description,
        }

    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "avatar_url": current_user.avatar_url,
            "job_title": current_user.job_title,
            "is_superuser": current_user.is_superuser,
            "is_active": current_user.is_active,
        },
        "permissions": perms["permission_codes"],
        "roles": perms["roles"],
        "organizations": [_org(o) for o in organizations],
        "current_org": _org(current_org) if current_org else None,
        "workspaces": [_ws(w) for w in workspaces],
        "current_workspace": _ws(current_ws) if current_ws else None,
        "projects": [_proj(p) for p in projects],
        "current_project": _proj(current_proj) if current_proj else None,
        "context_version": version_data["access_version"],
        "generated_at": datetime.now(timezone.utc),
        "feature_flags": {},
        "preferences": {},
    }
