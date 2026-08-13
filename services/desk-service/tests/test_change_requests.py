from app.schemas.change_request import ChangeRequestCreate, ChangeRequestUpdate
from app.services.change_request_service import ChangeRequestService

from .conftest import create_ticket


def test_create_list_get_update_change_request(db):
    ticket = create_ticket(db)
    change = ChangeRequestService(db).create(ChangeRequestCreate(workspace_id=1, ticket_id=ticket.id, title="Patch config", description="Change timeout."))
    assert ChangeRequestService(db).list(workspace_id=1)[0].id == change.id
    assert ChangeRequestService(db).get(change.id).title == "Patch config"
    assert ChangeRequestService(db).update(change.id, ChangeRequestUpdate(status="approved")).status == "approved"
