from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.incident import IncidentAISummaryRead, IncidentCreate, IncidentMemoryDocumentPayload, IncidentRead, IncidentUpdate
from app.schemas.postmortem import PostmortemCreate, PostmortemRead
from app.schemas.timeline import TimelineEventCreate, TimelineEventRead
from app.services.services import IncidentService, PostmortemService, TimelineService

router = APIRouter()

@router.post("", response_model=IncidentRead, status_code=201)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)): return IncidentService(db).create(data)

@router.get("", response_model=list[IncidentRead])
def list_incidents(workspace_id: int | None = None, project_id: int | None = None, status: str | None = None, severity: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return IncidentService(db).list(workspace_id=workspace_id, project_id=project_id, status=status, severity=severity, limit=limit, offset=offset)

@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: int, db: Session = Depends(get_db)): return IncidentService(db).get(incident_id)

@router.post("/{incident_id}/ai-summary", response_model=IncidentAISummaryRead)
def ai_summary_incident(incident_id: int, db: Session = Depends(get_db)): return IncidentService(db).ai_summary(incident_id)

@router.post("/{incident_id}/prepare-memory-document", response_model=IncidentMemoryDocumentPayload)
def prepare_memory_document(incident_id: int, db: Session = Depends(get_db)): return IncidentService(db).prepare_memory_document(incident_id)

@router.patch("/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: int, data: IncidentUpdate, db: Session = Depends(get_db)): return IncidentService(db).update(incident_id, data)

@router.post("/{incident_id}/timeline", response_model=TimelineEventRead, status_code=201)
def create_timeline_event(incident_id: int, data: TimelineEventCreate, db: Session = Depends(get_db)): return TimelineService(db).create(incident_id, data)

@router.get("/{incident_id}/timeline", response_model=list[TimelineEventRead])
def list_timeline(incident_id: int, db: Session = Depends(get_db)): return TimelineService(db).list_by_incident(incident_id)

@router.post("/{incident_id}/postmortem", response_model=PostmortemRead, status_code=201)
def create_postmortem(incident_id: int, data: PostmortemCreate, db: Session = Depends(get_db)): return PostmortemService(db).create(incident_id, data)

@router.get("/{incident_id}/postmortem", response_model=PostmortemRead)
def get_postmortem(incident_id: int, db: Session = Depends(get_db)): return PostmortemService(db).get_by_incident(incident_id)
