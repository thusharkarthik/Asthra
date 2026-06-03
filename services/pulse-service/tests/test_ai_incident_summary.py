import json

from fastapi import HTTPException

from app.api.v1.incidents import ai_summary_incident
from app.core.config import settings
from app.schemas.timeline import TimelineEventCreate
from app.services.services import IncidentService, TimelineService

from .conftest import create_incident


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "current_situation": "API latency is elevated.",
                    "impact": "Some customers see slow requests.",
                    "likely_cause": "Database saturation.",
                    "timeline_summary": "Alert fired and root cause is under review.",
                    "next_actions": ["Scale database", "Monitor latency"],
                    "customer_facing_update_draft": "We are investigating elevated API latency.",
                },
            ),
        }


def test_ai_incident_summary_endpoint_with_mocked_ai_service(db, monkeypatch):
    incident = create_incident(db)
    TimelineService(db).create(incident.id, TimelineEventCreate(event_type="update", content="Root cause suspected."))
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = ai_summary_incident(incident.id, db=db)

    assert response.incident_id == incident.id
    assert response.current_situation == "API latency is elevated."
    assert "Scale database" in response.next_actions


def test_ai_incident_summary_missing_incident(db):
    try:
        IncidentService(db).ai_summary(999)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected missing incident to raise 404.")
