from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.alert import AlertCreate, AlertRead, AlertUpdate
from app.services.services import AlertService

router = APIRouter()

@router.post("", response_model=AlertRead, status_code=201)
def create_alert(data: AlertCreate, db: Session = Depends(get_db)): return AlertService(db).create(data)

@router.get("", response_model=list[AlertRead])
def list_alerts(workspace_id: int | None = None, status: str | None = None, severity: str | None = None, source: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return AlertService(db).list(workspace_id=workspace_id, status=status, severity=severity, source=source, limit=limit, offset=offset)

@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: int, db: Session = Depends(get_db)): return AlertService(db).get(alert_id)

@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(alert_id: int, data: AlertUpdate, db: Session = Depends(get_db)): return AlertService(db).update(alert_id, data)
