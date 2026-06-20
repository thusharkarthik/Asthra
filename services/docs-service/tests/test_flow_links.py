from app.schemas.flow_link import PageFlowWorkItemCreate
from app.services.flow_link_service import FlowLinkService
from tests.conftest import create_page


class MockResponse:
    def __init__(self, payload):
        self._payload = payload
        self.content = b"{}"
        self.text = str(payload)

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


def test_create_flow_work_item_from_page_creates_doc_flow_link(db, monkeypatch):
    page = create_page(db, title="Requirements", content="Build the first workflow")

    def fake_post(url, json, timeout):
        if url.endswith("/links"):
            return MockResponse({"id": 9})
        return MockResponse({"id": 77, "title": json["title"], "status_id": 1, "assignee_id": None, "priority_id": 2})

    monkeypatch.setattr("app.services.flow_link_service.settings.flow_service_url", "http://flow-service:8000")
    monkeypatch.setattr("app.services.flow_link_service.httpx.post", fake_post)

    link = FlowLinkService(db).create_work_item_from_page(
        page.id,
        PageFlowWorkItemCreate(project_id=10, work_item_type="story", reporter_id=1),
    )

    assert link.docs_page_id == page.id
    assert link.flow_work_item_id == 77
    assert link.flow_item_type == "story"
    assert link.priority_id == 2


def test_list_page_work_items(db, monkeypatch):
    page = create_page(db)
    def fake_post(url, json, timeout):
        if url.endswith("/links"):
            return MockResponse({"id": 10})
        return MockResponse({"id": 78, "title": json["title"], "status_id": 1})

    monkeypatch.setattr("app.services.flow_link_service.settings.flow_service_url", "http://flow-service:8000")
    monkeypatch.setattr("app.services.flow_link_service.httpx.post", fake_post)

    FlowLinkService(db).create_work_item_from_page(page.id, PageFlowWorkItemCreate(project_id=10, work_item_type="task"))

    links = FlowLinkService(db).list_page_work_items(page.id)
    assert len(links) == 1
    assert links[0].flow_item_type == "task"
