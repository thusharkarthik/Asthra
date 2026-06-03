import json

from fastapi import HTTPException

from app.api.v1.router import ai_summary_release
from app.core.config import settings
from app.schemas.schemas import DeploymentCreate, ReleaseCreate
from app.services.services import DeploymentService, ReleaseService

from .conftest import create_env, create_service


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "release_overview": "Release 1.0.0 ships the API foundation.",
                    "shipped_changes": ["API foundation", "Deployment metadata"],
                    "deployment_risk": "medium",
                    "rollback_considerations": "Rollback to previous image.",
                    "stakeholder_summary": "Ready for controlled rollout.",
                    "qa_notes": ["Run smoke tests"],
                },
            ),
        }


def test_ai_release_summary_endpoint_with_mocked_ai_service(db, monkeypatch):
    service = create_service(db)
    environment = create_env(db)
    release = ReleaseService(db).create(ReleaseCreate(workspace_id=1, service_id=service.id, version="1.0.0"))
    DeploymentService(db).create(
        DeploymentCreate(workspace_id=1, environment_id=environment.id, service_id=service.id, version="1.0.0"),
    )
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = ai_summary_release(release.id, db=db)

    assert response.release_id == release.id
    assert response.release_overview == "Release 1.0.0 ships the API foundation."
    assert "API foundation" in response.shipped_changes


def test_ai_release_summary_missing_release(db):
    try:
        ReleaseService(db).ai_summary(999)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected missing release to raise 404.")
