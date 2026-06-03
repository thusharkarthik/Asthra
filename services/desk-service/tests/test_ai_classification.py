import json

from fastapi import HTTPException

from app.api.v1.tickets import ai_classify_ticket
from app.core.config import settings
from app.services.ticket_service import TicketService

from .conftest import create_ticket


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "category": "access",
                    "priority_suggestion": "high",
                    "severity_suggestion": "medium",
                    "routing_suggestion": "identity support queue",
                    "possible_duplicate_hints": ["similar login failures"],
                    "recommended_next_action": "Check recent auth errors.",
                },
            ),
        }


def test_ai_ticket_classification_endpoint_with_mocked_ai_service(db, monkeypatch):
    ticket = create_ticket(db)
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = ai_classify_ticket(ticket.id, db=db)

    assert response.ticket_id == ticket.id
    assert response.category == "access"
    assert response.priority_suggestion == "high"
    assert response.possible_duplicate_hints == ["similar login failures"]


def test_ai_ticket_classification_disabled_behavior(db, monkeypatch):
    ticket = create_ticket(db)
    monkeypatch.setattr(settings, "ai_features_enabled", False)
    monkeypatch.setattr(settings, "ai_service_url", "")

    try:
        TicketService(db).ai_classify(ticket.id)
    except HTTPException as exc:
        assert exc.status_code == 503
    else:
        raise AssertionError("Expected disabled AI features to raise a clean error.")


def test_ai_ticket_classification_missing_ticket(db):
    try:
        TicketService(db).ai_classify(999)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected missing ticket to raise 404.")
