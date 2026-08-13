from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.queue import QueueCreate, QueueRead
from app.services.queue_service import QueueService

router = APIRouter()


@router.post("", response_model=QueueRead, status_code=201)
def create_queue(data: QueueCreate, db: Session = Depends(get_db)):
    return QueueService(db).create(data)


@router.get("", response_model=list[QueueRead])
def list_queues(workspace_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return QueueService(db).list(workspace_id)
