import json

from app.api.v1.ideas import analyze_idea
from app.core.config import settings
from app.models.idea_ai_analysis import IdeaAIAnalysis
from app.services.idea_ai_service import IdeaAIService

from .conftest import create_idea


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "summary": "Strong workflow idea.",
                    "problem_clarity": "Clear problem.",
                    "target_users": "Product teams.",
                    "feasibility": "Feasible MVP.",
                    "risks": "Adoption risk.",
                    "mvp_suggestion": "Start with inbox and scoring.",
                    "monetization_angle": "Team tier.",
                    "next_steps": "Interview users.",
                },
            ),
        }


def test_ai_idea_analysis_endpoint_with_mocked_ai_service(db, monkeypatch):
    idea = create_idea(db)
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = analyze_idea(idea.id, db=db)

    assert response.idea_id == idea.id
    assert response.summary == "Strong workflow idea."
    assert response.mvp_suggestion == "Start with inbox and scoring."
    assert db.query(IdeaAIAnalysis).count() == 1


def test_ai_idea_analysis_disabled_behavior(db, monkeypatch):
    idea = create_idea(db)
    monkeypatch.setattr(settings, "ai_features_enabled", False)
    monkeypatch.setattr(settings, "ai_service_url", "")

    try:
        IdeaAIService(db).analyze(idea.id)
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 503
    else:
        raise AssertionError("Expected disabled AI features to raise a clean error.")
