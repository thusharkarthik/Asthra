import json

from fastapi import HTTPException

from app.api.v1.work_items import ai_breakdown_work_item
from app.core.config import settings
from app.services.work_item_service import WorkItemService

from .conftest import create_work_item


class MockAIResponse:
    status_code = 200

    def json(self):
        return {
            "generated_text": json.dumps(
                {
                    "subtasks": ["Design API", "Write tests"],
                    "acceptance_criteria": ["Endpoint returns structured JSON"],
                    "risks": ["Scope creep"],
                    "dependencies": ["AI Service"],
                    "estimated_complexity": "medium",
                },
            ),
        }


def test_ai_task_breakdown_endpoint_with_mocked_ai_service(db, monkeypatch):
    work_item = create_work_item(db, title="Build AI task breakdown")
    monkeypatch.setattr(settings, "ai_features_enabled", True)
    monkeypatch.setattr(settings, "ai_service_url", "http://ai-service")
    monkeypatch.setattr("app.services.ai_client.httpx.post", lambda *args, **kwargs: MockAIResponse())

    response = ai_breakdown_work_item(work_item.id, db=db, _=None)

    assert response.work_item_id == work_item.id
    assert response.subtasks == ["Design API", "Write tests"]
    assert response.estimated_complexity == "medium"


def test_ai_task_breakdown_missing_work_item(db):
    try:
        WorkItemService(db).ai_breakdown(999)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected missing work item to raise 404.")
