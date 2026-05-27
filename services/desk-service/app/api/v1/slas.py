from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sla import SLACreate, SLARead
from app.services.sla_service import SLAService

router = APIRouter()


@router.post("", response_model=SLARead, status_code=201)
def create_sla(data: SLACreate, db: Session = Depends(get_db)):
    return SLAService(db).create(data)


@router.get("", response_model=list[SLARead])
def list_slas(workspace_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return SLAService(db).list(workspace_id)
