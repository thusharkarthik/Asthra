import asyncio

from app.services import platform


def test_platform_routes_exist(app):
    paths = {route.path for route in app.routes}

    assert "/api/platform/activity" in paths
    assert "/api/platform/notifications" in paths
    assert "/api/platform/recent-items" in paths
    assert "/api/platform/favorites" in paths
    assert "/api/platform/relationships" in paths
    assert "/api/platform/relationships/entity/{entity_type}/{entity_id}" in paths
    assert "/api/platform/relationships/{relationship_id}" in paths
    assert "/api/platform/search" in paths
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
        "source_type": "discover_idea",
        "source_id": "1",
        "target_type": "flow_work_item",
        "target_id": "2",
        "relationship_type": "originates_from",
        "source_title": "Idea",
        "target_title": "Task",
    })

    assert relationship["relationship_type"] == "originates_from"
    assert relationship["source"]["title"] == "Idea"
    assert platform.list_relationships(entity_type="discover_idea", entity_id="1")
    assert platform.delete_relationship(relationship["id"]) is True


def test_platform_search_entities():
    results = platform.search_entities("gateway", module="flow")

    assert any(item["title"] == "API gateway routing" for item in results)


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
