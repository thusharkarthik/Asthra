from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard_summary import DiscoverDashboardSummaryRead
from app.services.dashboard_summary_service import DiscoverDashboardSummaryService

router = APIRouter()


@router.get("/summary", response_model=DiscoverDashboardSummaryRead)
def get_dashboard_summary(workspace_id: int = Query(...), db: Session = Depends(get_db)):
    return DiscoverDashboardSummaryService(db).refresh(workspace_id)
