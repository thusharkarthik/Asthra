from pathlib import Path

from fastapi import HTTPException

from app.api.v1.work_items import create_work_item as create_work_item_endpoint
from app.api.v1.work_items import get_work_item, list_work_items
from app.main import create_app
from app.models.work_item_priority import WorkItemPriority
from app.models.work_item_status import WorkItemStatus
from app.models.work_item_type import WorkItemType
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate
from app.services.work_item_service import WorkItemService
from tests.conftest import create_work_item


def test_only_one_work_item_create_schema_definition_exists():
    service_root = Path(__file__).resolve().parents[1]
    matches = [
        path
        for path in service_root.rglob("*.py")
        if "tests" not in path.parts
        if "class WorkItemCreate" in path.read_text()
    ]
    assert matches == [service_root / "app" / "schemas" / "work_item.py"]


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


def test_create_work_item_succeeds_with_minimal_payload(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)

    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Minimal work item"))

    assert work_item.id is not None
    assert work_item.project_id == 42
    assert work_item.title == "Minimal work item"
    assert work_item.type_id is not None
    assert work_item.status_id is not None
    assert work_item.priority_id is not None
    assert work_item.reporter_id == 0
    assert work_item.assignee_id is None
    assert db.get(WorkItemType, work_item.type_id).name == "task"
    assert db.get(WorkItemStatus, work_item.status_id).name == "todo"
    assert db.get(WorkItemPriority, work_item.priority_id).name == "medium"


def test_work_item_create_schema_requires_only_project_and_title():
    schema = WorkItemCreate.model_json_schema()
    assert set(schema["required"]) == {"project_id", "title"}

    app = create_app()
    work_item_create_ref = app.openapi()["paths"]["/api/v1/work-items"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]
    schema_name = work_item_create_ref.rsplit("/", 1)[-1]
    openapi_schema = app.openapi()["components"]["schemas"][schema_name]
    assert set(openapi_schema["required"]) == {"project_id", "title"}
    for field in ["type_id", "status_id", "priority_id", "reporter_id", "assignee_id"]:
        assert field not in openapi_schema["required"]


def test_create_work_item_endpoint_accepts_minimal_payload_without_422(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)

    created = create_work_item_endpoint(
        WorkItemCreate(project_id=3, title="test", description="test"),
        db=db,
    )

    assert created.project_id == 3
    assert created.title == "test"
    assert created.description == "test"
    assert created.type_id is not None
    assert created.status_id is not None
    assert created.priority_id is not None
    assert created.reporter_id == 0


def test_create_work_item_succeeds_with_description_and_without_assignee(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)

    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=42,
            title="Describe work item",
            description="Created with a description and no assignee.",
        )
    )

    assert work_item.description == "Created with a description and no assignee."
    assert work_item.assignee_id is None
    assert work_item.type_id is not None
    assert work_item.status_id is not None
    assert work_item.priority_id is not None


def test_work_item_api_routes_create_list_and_get(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    app = create_app()
    openapi_paths = app.openapi()["paths"]
    assert "/api/v1/work-items" in openapi_paths
    assert "post" in openapi_paths["/api/v1/work-items"]

    created = create_work_item_endpoint(WorkItemCreate(project_id=42, title="Create from API"), db=db)
    assert created.title == "Create from API"
    assert created.project_id == 42

    listed = list_work_items(project_id=42, limit=50, offset=0, db=db)
    assert len(listed) == 1

    fetched = get_work_item(created.id, db=db)
    assert fetched.id == created.id


def test_update_work_item_accepts_status_and_priority_names(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Move on board"))

    updated = WorkItemService(db).update(
        work_item.id,
        WorkItemUpdate(status_name="in_progress", priority_name="high"),
    )

    assert updated.status_id is not None
    assert updated.priority_id is not None
    assert db.get(WorkItemStatus, updated.status_id).name == "in_progress"
    assert db.get(WorkItemPriority, updated.priority_id).name == "high"
