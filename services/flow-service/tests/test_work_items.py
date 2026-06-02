from fastapi import HTTPException

from app.schemas.work_item import WorkItemUpdate
from app.services.work_item_service import WorkItemService
from tests.conftest import create_work_item


def test_work_item_crud(db, monkeypatch):
    published_events = []
    monkeypatch.setattr(
        "app.services.work_item_service.publish_event",
        lambda event_name, **kwargs: published_events.append((event_name, kwargs)),
    )
    work_item = create_work_item(db, title="Implement Flow CRUD")
    service = WorkItemService(db)

    work_items = service.list(project_id=1)
    assert len(work_items) == 1

    fetched_work_item = service.get(work_item.id)
    assert fetched_work_item.title == "Implement Flow CRUD"

    updated_work_item = service.update(
        work_item.id,
        WorkItemUpdate(title="Implement Flow CRUD tests"),
    )
    assert updated_work_item.title == "Implement Flow CRUD tests"
    assert "flow.work_item.created" in [event[0] for event in published_events]
    assert "flow.work_item.updated" in [event[0] for event in published_events]

    service.delete(work_item.id)

    try:
        service.get(work_item.id)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected deleted work item to return 404.")
