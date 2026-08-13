from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard_summary import ProjectSummaryRead, WorkspaceSummaryRead
from app.services.dashboard_summary_service import CoreDashboardSummaryService

router = APIRouter()


@router.get("/workspace-summary", response_model=WorkspaceSummaryRead)
def get_workspace_summary(
    organization_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    return CoreDashboardSummaryService(db).refresh_workspace_summary(organization_id)


@router.get("/project-summary", response_model=ProjectSummaryRead)
def get_project_summary(
    workspace_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    return CoreDashboardSummaryService(db).refresh_project_summary(workspace_id)
