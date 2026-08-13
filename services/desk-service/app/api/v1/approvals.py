from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.approval import ApprovalRead, ApprovalUpdate
from app.services.approval_service import ApprovalService

router = APIRouter()


@router.patch("/{approval_id}", response_model=ApprovalRead)
def update_approval(approval_id: int, data: ApprovalUpdate, db: Session = Depends(get_db)):
    return ApprovalService(db).update(approval_id, data)
