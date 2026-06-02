import httpx

from asthra_api_client import AIClient, CoreClient, DocsClient, FlowClient, MemoryClient


def test_service_clients_use_expected_paths(monkeypatch):
    calls = []

    def fake_request(**kwargs):
        calls.append(kwargs)
        return httpx.Response(200, json={"success": True})

    monkeypatch.setattr("asthra_api_client.base.httpx.request", fake_request)

    CoreClient("http://core").list_projects(workspace_id=1)
    FlowClient("http://flow").list_work_items(project_id=1)
    DocsClient("http://docs").list_pages(space_id=1)
    AIClient("http://ai").chat_completion({"messages": []})
    MemoryClient("http://memory").search({"query": "test"})

    urls = [call["url"] for call in calls]
    assert "http://core/api/v1/projects" in urls
    assert "http://flow/api/v1/work-items" in urls
    assert "http://docs/api/v1/pages" in urls
    assert "http://ai/api/v1/completions/chat" in urls
    assert "http://memory/api/v1/retrieval/search" in urls
