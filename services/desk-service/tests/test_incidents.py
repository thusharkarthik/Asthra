from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.services.incident_service import IncidentService

from .conftest import create_ticket


def test_create_list_get_update_incident(db):
    ticket = create_ticket(db)
    incident = IncidentService(db).create(IncidentCreate(workspace_id=1, ticket_id=ticket.id, title="Outage", description="API degraded.", severity="high"))
    assert IncidentService(db).list(workspace_id=1, status="open", severity="high", limit=10, offset=0)[0].id == incident.id
    assert IncidentService(db).get(incident.id).title == "Outage"
    assert IncidentService(db).update(incident.id, IncidentUpdate(severity="critical")).severity == "critical"
