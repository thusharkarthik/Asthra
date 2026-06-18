from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError

from app.api.v1.work_items import create_work_item as create_work_item_endpoint
from app.api.v1.work_items import get_work_item, list_work_items
from app.main import create_app
from app.models.work_item_priority import WorkItemPriority
from app.models.work_item_status import WorkItemStatus
from app.models.work_item_type import WorkItemType
from app.models.flow_activity import FlowActivity
from app.schemas.work_item import LinkedEntityCreate, WorkItemCreate, WorkItemUpdate
from app.schemas.work_item import WorkItemParentUpdate, WorkItemRelationCreate
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
    assert db.get(WorkItemStatus, work_item.status_id).key == "todo"
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
    assert db.get(WorkItemStatus, updated.status_id).key == "in_progress"
    assert db.get(WorkItemPriority, updated.priority_id).name == "high"


def test_create_work_item_with_advanced_fields(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)

    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=42,
            title="Advanced work item",
            description="Richer planning item",
            status_name="review",
            priority_name="critical",
            effort_score=8,
            effort_size="L",
            business_value="high",
            risk_level="medium",
            complexity="high",
            acceptance_criteria="Given the feature is enabled, users can complete the flow.",
            definition_of_done="Tests pass\nDocs updated",
        )
    )

    assert work_item.effort_score == 8
    assert work_item.effort_size == "L"
    assert work_item.business_value == "high"
    assert work_item.risk_level == "medium"
    assert work_item.complexity == "high"
    assert work_item.acceptance_criteria.startswith("Given")
    assert work_item.definition_of_done.startswith("Tests")
    assert db.get(WorkItemStatus, work_item.status_id).key == "review"
    assert db.get(WorkItemPriority, work_item.priority_id).name == "critical"


def test_update_work_item_advanced_fields_and_parent(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    parent = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Parent feature", item_level="feature"))
    child = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Child work"))

    updated = WorkItemService(db).update(
        child.id,
        WorkItemUpdate(
            parent_id=parent.id,
            effort_size="XL",
            effort_score=13,
            business_value="critical",
            risk_level="high",
            complexity="medium",
            acceptance_criteria="Accepted when rollout is complete.",
            definition_of_done="Release notes published.",
        ),
    )

    assert updated.parent_id == parent.id
    assert updated.effort_size == "XL"
    assert updated.effort_score == 13
    assert updated.business_value == "critical"
    assert updated.risk_level == "high"
    assert updated.complexity == "medium"


def test_invalid_advanced_work_item_values_are_rejected():
    try:
        WorkItemCreate(project_id=1, title="Invalid", effort_size="XXL")
    except ValidationError as exc:
        assert "effort_size" in str(exc)
    else:
        raise AssertionError("Invalid effort_size should fail validation.")

    try:
        WorkItemCreate(project_id=1, title="Invalid", business_value="urgent")
    except ValidationError as exc:
        assert "business_value" in str(exc)
    else:
        raise AssertionError("Invalid business_value should fail validation.")


def test_flow_hierarchy_create_tree_and_change_parent(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)

    initiative = service.create(WorkItemCreate(project_id=42, title="Launch initiative", item_level="initiative"))
    feature = service.create(WorkItemCreate(project_id=42, title="Onboarding feature", item_level="feature", parent_id=initiative.id))
    work_item = service.create(WorkItemCreate(project_id=42, title="Build signup", item_level="work_item", parent_id=feature.id))
    subtask = service.create_subtask(work_item.id, WorkItemCreate(project_id=42, title="Write validation tests"))

    hierarchy = service.get_project_hierarchy(42)
    assert hierarchy.items[0].title == "Launch initiative"
    assert hierarchy.items[0].children[0].title == "Onboarding feature"
    assert hierarchy.items[0].children[0].children[0].title == "Build signup"
    assert hierarchy.items[0].children[0].children[0].children[0].title == "Write validation tests"
    assert subtask.item_level == "subtask"

    moved = service.update_parent(work_item.id, WorkItemParentUpdate(parent_id=initiative.id))
    assert moved.parent_id == initiative.id
    children = service.list_children(initiative.id)
    assert {child.id for child in children} == {feature.id, work_item.id}


def test_hierarchy_validation_rejects_invalid_parenting(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    initiative = service.create(WorkItemCreate(project_id=42, title="Initiative", item_level="initiative"))

    try:
        service.create(WorkItemCreate(project_id=42, title="Bad subtask", item_level="subtask"))
    except HTTPException as exc:
        assert exc.status_code == 400
    else:
        raise AssertionError("Subtask without parent should fail.")

    try:
        service.create(WorkItemCreate(project_id=42, title="Bad initiative", item_level="initiative", parent_id=initiative.id))
    except HTTPException as exc:
        assert exc.status_code == 400
    else:
        raise AssertionError("Initiative with parent should fail.")


def test_work_item_relations_add_reject_self_and_remove(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    first = service.create(WorkItemCreate(project_id=42, title="Item A"))
    second = service.create(WorkItemCreate(project_id=42, title="Item B"))

    relation = service.create_relation(first.id, WorkItemRelationCreate(target_work_item_id=second.id, relation_type="blocks", description="A blocks B"))

    relations = service.list_relations(first.id)
    assert len(relations) == 1
    assert relations[0].target_title == "Item B"
    assert relations[0].relation_type == "blocks"

    try:
        service.create_relation(first.id, WorkItemRelationCreate(target_work_item_id=first.id, relation_type="blocks"))
    except HTTPException as exc:
        assert exc.status_code == 400
    else:
        raise AssertionError("Self relation should fail.")

    service.delete_relation(first.id, relation.id)
    assert service.list_relations(first.id) == []


def test_work_item_links_create_list_remove_and_log_activity(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    work_item = service.create(WorkItemCreate(project_id=42, title="Traceable work"))

    link = service.create_link(
        work_item.id,
        LinkedEntityCreate(entity_type="doc_page", entity_id="page-123", entity_title="Architecture Notes"),
    )

    links = service.list_links(work_item.id)
    assert len(links) == 1
    assert links[0].id == link.id
    assert links[0].entity_type == "doc_page"
    assert links[0].entity_title == "Architecture Notes"

    service.delete_link(work_item.id, link.id)
    assert service.list_links(work_item.id) == []
    activity_actions = [activity.action for activity in db.query(FlowActivity).filter(FlowActivity.work_item_id == work_item.id).all()]
    assert "link_added" in activity_actions
    assert "link_removed" in activity_actions


def test_work_item_link_invalid_entity_type_rejected():
    try:
        LinkedEntityCreate(entity_type="unknown", entity_id="1", entity_title="Bad Link")
    except ValidationError as exc:
        assert "entity_type must be one of" in str(exc)
    else:
        raise AssertionError("Invalid linked entity type should fail validation.")
