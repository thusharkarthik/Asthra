from app.models.work_item_status import WorkItemStatus
from app.schemas.release import ReleaseCreate, ReleaseUpdate
from app.schemas.work_item import WorkItemCreate
from app.services.release_service import ReleaseService
from app.services.work_item_service import WorkItemService


def test_release_lifecycle_and_work_item_assignment(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item_service = WorkItemService(db)
    release_service = ReleaseService(db)
    work_item = work_item_service.create(WorkItemCreate(project_id=42, title="Release work", effort_score=8))

    release = release_service.create(
        ReleaseCreate(
            project_id=42,
            name="Launch Release",
            version="v1.0.0",
            description="First internal launch.",
        )
    )
    assert release.status == "planned"
    assert release.work_item_count == 0
    assert release.completion_percentage == 0

    release = release_service.update(release.id, ReleaseUpdate(description="Updated release notes."))
    assert release.description == "Updated release notes."

    release = release_service.assign_work_item(release.id, work_item.id)
    assert release.work_item_count == 1
    assert work_item_service.get(work_item.id).release_id == release.id

    release = release_service.activate(release.id)
    assert release.status == "active"

    done_status = WorkItemStatus(name="done", key="done", category="completed")
    db.add(done_status)
    db.flush()
    release_work_item = work_item_service.get(work_item.id)
    release_work_item.status_id = done_status.id
    db.add(release_work_item)
    db.commit()

    release = release_service.release(release.id)
    assert release.status == "released"
    assert release.actual_release_date is not None
    assert release.completed_work_count == 1
    assert release.completion_percentage == 100


def test_work_item_list_filters_by_release(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item_service = WorkItemService(db)
    release_service = ReleaseService(db)
    assigned = work_item_service.create(WorkItemCreate(project_id=7, title="Assigned release work"))
    work_item_service.create(WorkItemCreate(project_id=7, title="Backlog work"))
    release = release_service.create(ReleaseCreate(project_id=7, name="Filtered Release", version="v1.1.0"))
    release_service.assign_work_item(release.id, assigned.id)

    release_items = work_item_service.list(project_id=7, release_id=release.id)

    assert [item.id for item in release_items] == [assigned.id]
