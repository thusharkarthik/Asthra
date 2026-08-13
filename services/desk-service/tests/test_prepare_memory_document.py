from app.services.ticket_service import TicketService

from .conftest import create_ticket


def test_prepare_ticket_memory_document_payload(db):
    ticket = create_ticket(db)

    payload = TicketService(db).prepare_memory_document(ticket.id)

    assert payload.source_type == "support_ticket"
    assert payload.external_reference == f"support_ticket:{ticket.id}"
    assert payload.workspace_id == ticket.workspace_id
    assert payload.metadata["priority"] == ticket.priority
