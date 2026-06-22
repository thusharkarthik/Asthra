from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard_summary import DocsDashboardSummaryRead
from app.services.dashboard_summary_service import DocsDashboardSummaryService

router = APIRouter()


@router.get("/summary", response_model=DocsDashboardSummaryRead)
def get_dashboard_summary(workspace_id: int = Query(...), db: Session = Depends(get_db)):
    return DocsDashboardSummaryService(db).refresh(workspace_id)
