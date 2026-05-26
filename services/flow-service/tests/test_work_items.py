from app.schemas.work_item import WorkItemCreate
from app.services.work_item_service import WorkItemService


def test_create_work_item(db):
    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=1,
            title="Design Flow work items",
            type_id=1,
            status_id=1,
            priority_id=1,
            assignee_id=2,
            reporter_id=1,
        ),
    )

    assert work_item.id is not None
    assert work_item.project_id == 1
    assert work_item.title == "Design Flow work items"
    assert work_item.assignee_id == 2
