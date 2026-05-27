from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackRead
from app.services.feedback_service import FeedbackService

router = APIRouter()


@router.post("", response_model=FeedbackRead, status_code=201)
def create_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    return FeedbackService(db).create(data)


@router.get("", response_model=list[FeedbackRead])
def list_feedback(
    workspace_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return FeedbackService(db).list(workspace_id=workspace_id, limit=limit, offset=offset)
