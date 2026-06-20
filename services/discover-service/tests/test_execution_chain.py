from app.schemas.execution import CreateEpicRequest, GenerateSpecificationRequest
from app.services.execution_service import ExecutionService
from tests.conftest import create_idea


class MockResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.content = b"{}"
        self.text = str(payload)

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


def test_generate_idea_specification_creates_doc_link(db, monkeypatch):
    idea = create_idea(db)

    monkeypatch.setattr("app.services.execution_service.settings.docs_service_url", "http://docs-service:8000")
    monkeypatch.setattr(
        "app.services.execution_service.httpx.post",
        lambda *args, **kwargs: MockResponse({"id": 42, "title": "Discovery inbox Specification", "status": "draft"}),
    )

    link = ExecutionService(db).generate_idea_specification(
        idea.id,
        GenerateSpecificationRequest(space_id=5, created_by_id=1),
    )

    assert link.docs_page_id == 42
    assert link.source_type == "idea"
    db.refresh(idea)
    assert idea.docs_page_id == 42


def test_create_idea_epic_creates_flow_link(db, monkeypatch):
    idea = create_idea(db)

    def fake_post(url, json, timeout):
        if url.endswith("/links"):
            return MockResponse({"id": 99})
        return MockResponse({"id": 84, "title": "Discovery inbox", "status_id": 1, "priority_id": 2})

    monkeypatch.setattr("app.services.execution_service.settings.flow_service_url", "http://flow-service:8000")
    monkeypatch.setattr("app.services.execution_service.httpx.post", fake_post)

    link = ExecutionService(db).create_idea_epic(
        idea.id,
        CreateEpicRequest(project_id=10, reporter_id=1),
    )

    assert link.flow_work_item_id == 84
    assert link.flow_item_type == "epic"
    db.refresh(idea)
    assert idea.flow_epic_id == 84
    assert idea.status == "converted_to_work"


def test_delivery_pipeline_returns_persisted_links(db, monkeypatch):
    idea = create_idea(db)
    monkeypatch.setattr("app.services.execution_service.settings.docs_service_url", "http://docs-service:8000")
    monkeypatch.setattr(
        "app.services.execution_service.httpx.post",
        lambda *args, **kwargs: MockResponse({"id": 42, "title": "Discovery inbox Specification", "status": "draft"}),
    )
    ExecutionService(db).generate_idea_specification(idea.id, GenerateSpecificationRequest(space_id=5, created_by_id=1))

    pipeline = ExecutionService(db).delivery_pipeline(workspace_id=1, project_id=10)

    assert pipeline["counts"]["ideas"] == 1
    assert pipeline["counts"]["specifications"] == 1
    assert pipeline["specifications"][0]["id"] == 42
