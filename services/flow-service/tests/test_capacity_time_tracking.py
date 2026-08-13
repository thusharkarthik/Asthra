from app.api.v1.capacity import create_capacity, delete_capacity, list_capacity, update_capacity
from app.api.v1.work_logs import create_work_log, delete_work_log, list_work_logs
from app.schemas.capacity import TeamCapacityCreate, TeamCapacityUpdate
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate
from app.schemas.work_log import WorkLogCreate
from app.services.work_item_service import WorkItemService


def test_work_logs_create_list_delete(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Track time"))

    work_log = create_work_log(
        work_item.id,
        WorkLogCreate(user_id=1, description="Implementation", time_spent_minutes=90),
        db=db,
    )

    assert work_log.id is not None
    assert work_log.time_spent_minutes == 90
    assert work_log.work_item_id == work_item.id
    assert [log.id for log in list_work_logs(work_item.id, db=db)] == [work_log.id]

    delete_work_log(work_item.id, work_log.id, db=db)

    assert list_work_logs(work_item.id, db=db) == []


def test_work_item_estimates_can_be_updated(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    work_item = service.create(
        WorkItemCreate(
            project_id=42,
            title="Estimate work",
            original_estimate_minutes=240,
            remaining_estimate_minutes=180,
        )
    )

    updated = service.update(
        work_item.id,
        WorkItemUpdate(remaining_estimate_minutes=120),
    )

    assert updated.original_estimate_minutes == 240
    assert updated.remaining_estimate_minutes == 120


def test_capacity_crud(db):
    capacity = create_capacity(
        TeamCapacityCreate(project_id=42, user_id=7, sprint_id=3, capacity_minutes=1200, notes="One focused week"),
        db=db,
    )

    assert capacity.id is not None
    assert capacity.capacity_minutes == 1200
    assert [entry.id for entry in list_capacity(project_id=42, sprint_id=3, limit=50, offset=0, db=db)] == [capacity.id]

    updated = update_capacity(
        capacity.id,
        TeamCapacityUpdate(capacity_minutes=900, notes="Reduced availability"),
        db=db,
    )
    assert updated.capacity_minutes == 900
    assert updated.notes == "Reduced availability"

    delete_capacity(capacity.id, db=db)

    assert list_capacity(project_id=42, limit=50, offset=0, db=db) == []
