from app.schemas.escalation import EscalationCreate
from app.services.escalation_service import EscalationService

from .conftest import create_ticket


def test_create_and_list_escalation(db):
    ticket = create_ticket(db)
    escalation = EscalationService(db).create(ticket.id, EscalationCreate(level="manager", reason="SLA risk"))
    assert EscalationService(db).list_by_ticket(ticket.id)[0].id == escalation.id
