import pytest
from fastapi import HTTPException

from app.schemas.ticket import TicketUpdate
from app.services.ticket_service import TicketService

from .conftest import create_ticket


def test_create_list_get_update_delete_ticket(db):
    ticket = create_ticket(db)
    tickets = TicketService(db).list(workspace_id=1, project_id=1, status="open", priority="medium", requester_id=10, limit=10, offset=0)
    assert [item.id for item in tickets] == [ticket.id]
    assert TicketService(db).get(ticket.id).title == "Login issue"
    assert TicketService(db).update(ticket.id, TicketUpdate(status="resolved")).status == "resolved"
    TicketService(db).delete(ticket.id)
    with pytest.raises(HTTPException):
        TicketService(db).get(ticket.id)
