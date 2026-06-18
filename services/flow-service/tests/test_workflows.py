from app.schemas.workflow import WorkflowAssignProject, WorkflowCreate, WorkflowStatusCreate, WorkflowTransitionCreate
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate
from app.services.work_item_service import WorkItemService
from app.services.workflow_service import WorkflowService


def test_create_workflow_status_transition_and_assign_project(db):
    service = WorkflowService(db)
    workflow = service.create(WorkflowCreate(name="Custom Workflow", description="Team-specific workflow"))

    backlog = service.add_status(workflow.id, WorkflowStatusCreate(name="Backlog", key="backlog", category="backlog", sort_order=0))
    ready = service.add_status(workflow.id, WorkflowStatusCreate(name="Ready", key="ready", category="active", sort_order=1))
    transition = service.add_transition(workflow.id, WorkflowTransitionCreate(from_status_id=backlog.id, to_status_id=ready.id))
    assigned = service.assign_project(workflow.id, WorkflowAssignProject(project_id=42))

    assert assigned.project_id == 42
    assert len(service.get(workflow.id).statuses) == 2
    assert transition.from_status_id == backlog.id
    assert transition.to_status_id == ready.id


def test_project_workflow_default_and_transition_validation(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    workflow = WorkflowService(db).ensure_project_workflow(42)
    todo = next(status for status in workflow.statuses if status.key == "todo")
    review = next(status for status in workflow.statuses if status.key == "review")
    in_progress = next(status for status in workflow.statuses if status.key == "in_progress")

    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Workflow item"))

    assert work_item.status_id == todo.id

    moved_to_review = WorkItemService(db).update(work_item.id, WorkItemUpdate(status_name="review"))
    assert moved_to_review.status_id == review.id

    moved = WorkItemService(db).update(work_item.id, WorkItemUpdate(status_name="in_progress"))

    assert moved.status_id == in_progress.id


def test_project_workflow_repairs_missing_default_statuses(db):
    service = WorkflowService(db)
    workflow = service.create(WorkflowCreate(project_id=77, name="Broken Workflow", is_default=True))
    service.add_status(workflow.id, WorkflowStatusCreate(name="Todo", key="todo", category="backlog", sort_order=0))

    repaired = service.ensure_project_workflow(77)
    status_keys = {status.key for status in repaired.statuses}
    status_names = {status.name for status in repaired.statuses}

    assert {"todo", "in_progress", "review", "done"}.issubset(status_keys)
    assert {"Todo", "In Progress", "Review", "Done"}.issubset(status_names)
    assert len(repaired.transitions) >= 4
