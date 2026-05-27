from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.on_call_schedule import OnCallScheduleCreate, OnCallScheduleRead
from app.services.services import OnCallScheduleService

router = APIRouter()

@router.post("", response_model=OnCallScheduleRead, status_code=201)
def create_schedule(data: OnCallScheduleCreate, db: Session = Depends(get_db)): return OnCallScheduleService(db).create(data)

@router.get("", response_model=list[OnCallScheduleRead])
def list_schedules(workspace_id: int | None = None, db: Session = Depends(get_db)): return OnCallScheduleService(db).list(workspace_id)

@router.get("/{schedule_id}", response_model=OnCallScheduleRead)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)): return OnCallScheduleService(db).get(schedule_id)
