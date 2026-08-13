from app.schemas.incident import IncidentUpdate
from app.schemas.timeline import TimelineEventCreate
from app.services.services import IncidentService, TimelineService
from .conftest import create_incident


def test_create_list_get_update_incident_and_timeline(db):
    incident = create_incident(db)
    assert IncidentService(db).list(workspace_id=1, project_id=2, status="open", severity="sev2", limit=10, offset=0)[0].id == incident.id
    loaded = IncidentService(db).get(incident.id)
    assert loaded.title == "API degraded"
    assert loaded.impacted_service == "api-gateway"
    assert IncidentService(db).update(incident.id, IncidentUpdate(status="mitigating")).status == "mitigating"
    event = TimelineService(db).create(incident.id, TimelineEventCreate(event_type="update", content="Root cause suspected."))
    assert TimelineService(db).list_by_incident(incident.id)[0].id == event.id
