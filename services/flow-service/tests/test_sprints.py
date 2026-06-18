from app.schemas.sprint import SprintCreate
from app.models.work_item_status import WorkItemStatus
from app.schemas.work_item import WorkItemCreate
from app.services.sprint_service import SprintService
from app.services.work_item_service import WorkItemService


def test_sprint_lifecycle_and_work_item_assignment(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item_service = WorkItemService(db)
    sprint_service = SprintService(db)
    work_item = work_item_service.create(WorkItemCreate(project_id=42, title="Sprint work", effort_score=5))

    sprint = sprint_service.create(SprintCreate(project_id=42, name="Sprint 1", goal="Ship sprint planning"))
    assert sprint.status == "planned"
    assert sprint.planned_work_count == 0

    sprint = sprint_service.assign_work_item(sprint.id, work_item.id)
    assert sprint.planned_work_count == 1
    assert sprint.total_effort == 5
    assert work_item_service.get(work_item.id).sprint_id == sprint.id

    sprint = sprint_service.start(sprint.id)
    assert sprint.status == "active"

    done_status = WorkItemStatus(name="done", key="done", category="completed")
    db.add(done_status)
    db.flush()
    sprint_work_item = work_item_service.get(work_item.id)
    sprint_work_item.status_id = done_status.id
    db.add(sprint_work_item)
    db.commit()

    sprint = sprint_service.complete(sprint.id)
    assert sprint.status == "completed"
    assert sprint.completed_work_count == 1
