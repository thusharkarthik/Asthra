import json

from fastapi import HTTPException

from app.api.v1.pages import summarize_page
from app.core.config import settings
from app.services.page_service import PageService

from .conftest import create_page


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "short_summary": "This page explains the platform architecture.",
                    "key_points": ["Gateway routes requests", "Memory supports retrieval"],
                    "action_items": ["Review service boundaries"],
                    "related_questions": ["How does auth propagate?"],
                },
            ),
        }


def test_ai_page_summary_endpoint_with_mocked_ai_service(db, monkeypatch):
    page = create_page(db, title="Architecture", content="Gateway, Memory, and AI work together.")
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = summarize_page(page.id, db=db, _=None)

    assert response.page_id == page.id
    assert response.short_summary == "This page explains the platform architecture."
    assert "Gateway routes requests" in response.key_points


def test_ai_page_summary_missing_page(db):
    try:
        PageService(db).ai_summary(999)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected missing page to raise 404.")
