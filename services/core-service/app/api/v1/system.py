from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.responses import success_response
from app.db.session import get_db
from app.models.organization import OrganizationMember
from app.models.user import RoleAssignment, User
from app.models.workspace import Workspace, WorkspaceMember


router = APIRouter()


@router.get("/info")
def system_info(request: Request):
    return success_response(
        data={
            "service_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "api_version": settings.api_v1_prefix,
        },
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/backfill-memberships", status_code=status.HTTP_200_OK)
def backfill_memberships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create missing OrganizationMember/WorkspaceMember records for users who only have direct role assignments."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superuser required.")

    created_org = 0
    created_ws = 0

    org_assignments = (
        db.query(RoleAssignment)
        .filter(
            RoleAssignment.scope_type == "organization",
            RoleAssignment.status == "active",
            RoleAssignment.scope_id.is_not(None),
        )
        .all()
    )
    for assignment in org_assignments:
        exists = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == assignment.scope_id,
                OrganizationMember.user_id == assignment.user_id,
            )
            .first()
        )
        if exists is None:
            db.add(
                OrganizationMember(
                    organization_id=assignment.scope_id,
                    user_id=assignment.user_id,
                    role_id=assignment.role_id,
                    member_role="member",
                )
            )
            created_org += 1

    ws_assignments = (
        db.query(RoleAssignment)
        .filter(
            RoleAssignment.scope_type == "workspace",
            RoleAssignment.status == "active",
            RoleAssignment.scope_id.is_not(None),
        )
        .all()
    )
    for assignment in ws_assignments:
        workspace = db.get(Workspace, assignment.scope_id)
        if workspace is None:
            continue
        ws_exists = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace.id,
                WorkspaceMember.user_id == assignment.user_id,
            )
            .first()
        )
        if ws_exists is None:
            db.add(
                WorkspaceMember(
                    workspace_id=workspace.id,
                    user_id=assignment.user_id,
                    member_role="member",
                )
            )
            created_ws += 1
        if workspace.organization_id:
            org_exists = (
                db.query(OrganizationMember)
                .filter(
                    OrganizationMember.organization_id == workspace.organization_id,
                    OrganizationMember.user_id == assignment.user_id,
                )
                .first()
            )
            if org_exists is None:
                db.add(
                    OrganizationMember(
                        organization_id=workspace.organization_id,
                        user_id=assignment.user_id,
                        member_role="member",
                    )
                )
                created_org += 1

    db.commit()
    return {"created_org_members": created_org, "created_workspace_members": created_ws}
