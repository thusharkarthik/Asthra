from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.services.incident_service import IncidentService

router = APIRouter()


@router.post("", response_model=IncidentRead, status_code=201)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    return IncidentService(db).create(data)


@router.get("", response_model=list[IncidentRead])
def list_incidents(
    workspace_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return IncidentService(db).list(workspace_id=workspace_id, status=status, severity=severity, limit=limit, offset=offset)


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    return IncidentService(db).get(incident_id)


@router.patch("/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: int, data: IncidentUpdate, db: Session = Depends(get_db)):
    return IncidentService(db).update(incident_id, data)
