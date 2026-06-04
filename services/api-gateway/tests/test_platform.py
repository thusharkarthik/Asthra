import asyncio

from app.services import platform


def test_platform_routes_exist(app):
    paths = {route.path for route in app.routes}

    assert "/api/platform/activity" in paths
    assert "/api/platform/notifications" in paths
    assert "/api/platform/recent-items" in paths
    assert "/api/platform/favorites" in paths
    assert "/api/platform/relationships" in paths
    assert "/api/platform/dashboard" in paths
    assert "/platform/health" in paths


def test_activity_contract():
    items = platform.list_activity()

    assert items
    assert {"actor", "action", "entity", "timestamp", "source"}.issubset(items[0].keys())


def test_notification_read_and_dismiss():
    item = platform.mark_notification_read("notif-1")

    assert item is not None
    assert item["unread"] is False


def test_favorites_add_and_remove():
    favorite = platform.add_favorite({
        "source": "flow",
        "entity_type": "work_item",
        "entity_id": "test",
        "title": "Test work item",
        "href": "/flow/work-items/test",
    })

    assert favorite["title"] == "Test work item"
    assert platform.remove_favorite("flow", "work_item", "test") is True


def test_relationships_add():
    relationship = platform.add_relationship({
        "from": {"source": "discover", "entity_type": "idea", "entity_id": "1", "title": "Idea", "href": "/discover/ideas/1"},
        "to": {"source": "flow", "entity_type": "work_item", "entity_id": "2", "title": "Task", "href": "/flow/work-items/2"},
        "relation": "idea_to_work_item",
    })

    assert relationship["relation"] == "idea_to_work_item"
    assert relationship["from"]["title"] == "Idea"


def test_dashboard_summary():
    summary = platform.workspace_dashboard_summary()

    assert "work" in summary
    assert "docs" in summary
    assert "ai" in summary


def test_platform_health(monkeypatch):
    async def fake_health_response():
        return {"status": "healthy", "services": [{"name": "core-service", "status": "healthy"}]}

    monkeypatch.setattr("app.services.platform.service_health_response", fake_health_response)

    response = asyncio.run(platform.platform_health())

    assert response["gateway"]["service"] == "asthra-api-gateway"
    assert response["status"] == "healthy"
