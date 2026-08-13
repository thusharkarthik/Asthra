from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard_summary import PulseDashboardSummaryRead
from app.services.dashboard_summary_service import PulseDashboardSummaryService

router = APIRouter()


@router.get("/summary", response_model=PulseDashboardSummaryRead)
def get_dashboard_summary(workspace_id: int = Query(...), db: Session = Depends(get_db)):
    return PulseDashboardSummaryService(db).refresh(workspace_id)
