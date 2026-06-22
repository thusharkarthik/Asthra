from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard_summary import DeskDashboardSummaryRead
from app.services.dashboard_summary_service import DeskDashboardSummaryService

router = APIRouter()


@router.get("/summary", response_model=DeskDashboardSummaryRead)
def get_dashboard_summary(workspace_id: int = Query(...), db: Session = Depends(get_db)):
    return DeskDashboardSummaryService(db).refresh(workspace_id)
