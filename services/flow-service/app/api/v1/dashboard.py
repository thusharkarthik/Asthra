from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard_summary import FlowDashboardSummaryRead
from app.services.dashboard_summary_service import FlowDashboardSummaryService

router = APIRouter()


@router.get("/summary", response_model=FlowDashboardSummaryRead)
def get_dashboard_summary(project_id: int = Query(...), db: Session = Depends(get_db)):
    return FlowDashboardSummaryService(db).refresh(project_id)
