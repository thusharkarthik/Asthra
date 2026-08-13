from app.schemas.timeline import TimelineEventCreate
from app.services.services import IncidentService, TimelineService

from .conftest import create_incident


def test_prepare_incident_memory_document_payload(db):
    incident = create_incident(db)
    TimelineService(db).create(incident.id, TimelineEventCreate(event_type="update", content="Mitigation started."))

    payload = IncidentService(db).prepare_memory_document(incident.id)

    assert payload.source_type == "incident"
    assert payload.external_reference == f"incident:{incident.id}"
    assert payload.workspace_id == incident.workspace_id
    assert "Mitigation started" in payload.content
