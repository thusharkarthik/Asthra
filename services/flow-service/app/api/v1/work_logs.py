from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item import WorkItem
from app.models.work_log import WorkLog
from app.schemas.work_log import WorkLogCreate, WorkLogRead

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and membership checks.
    return None


def get_active_work_item(db: Session, work_item_id: int) -> WorkItem:
    work_item = db.get(WorkItem, work_item_id)
    if work_item is None or not work_item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item not found.")
    return work_item


@router.post("/work-items/{work_item_id}/work-logs", response_model=WorkLogRead, status_code=status.HTTP_201_CREATED)
def create_work_log(
    work_item_id: int,
    work_log_create: WorkLogCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkLog:
    get_active_work_item(db, work_item_id)
    work_log = WorkLog(
        work_item_id=work_item_id,
        user_id=work_log_create.user_id,
        description=work_log_create.description,
        time_spent_minutes=work_log_create.time_spent_minutes,
        logged_at=work_log_create.logged_at or datetime.now(UTC),
    )
    db.add(work_log)
    db.commit()
    db.refresh(work_log)
    return work_log


@router.get("/work-items/{work_item_id}/work-logs", response_model=list[WorkLogRead])
def list_work_logs(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkLog]:
    get_active_work_item(db, work_item_id)
    statement = select(WorkLog).where(WorkLog.work_item_id == work_item_id).order_by(WorkLog.logged_at.desc(), WorkLog.id.desc())
    return list(db.scalars(statement).all())


@router.delete("/work-items/{work_item_id}/work-logs/{work_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_log(
    work_item_id: int,
    work_log_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    get_active_work_item(db, work_item_id)
    work_log = db.get(WorkLog, work_log_id)
    if work_log is None or work_log.work_item_id != work_item_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work log not found.")
    db.delete(work_log)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
