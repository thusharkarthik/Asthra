from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas import EventRecordCreate, EventRecordRead
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=dict)
def publish_event(payload: EventRecordCreate, db: Session = Depends(get_db)):
    event = EventService(db).publish(payload)
    return success_response(data=EventRecordRead.model_validate(event).model_dump(mode="json"))


@router.get("", response_model=dict)
def list_events(
    event_name: str | None = None,
    source_service: str | None = None,
    workspace_id: int | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    events = EventService(db).list_events(
        event_name=event_name,
        source_service=source_service,
        workspace_id=workspace_id,
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset,
    )
    return success_response(data=[EventRecordRead.model_validate(event).model_dump(mode="json") for event in events])


@router.get("/{event_id}", response_model=dict)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = EventService(db).get_event(event_id)
    return success_response(data=EventRecordRead.model_validate(event).model_dump(mode="json"))
