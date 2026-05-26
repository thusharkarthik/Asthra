from app.schemas.label import WorkItemLabelAssign, WorkItemLabelCreate
from app.schemas.work_item import WorkItemCreate
from app.services.label_service import LabelService
from app.services.work_item_service import WorkItemService


def test_add_label(db):
    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=1,
            title="Label target",
            type_id=1,
            status_id=1,
            priority_id=1,
            reporter_id=1,
        ),
    )
    label_service = LabelService(db)
    label = label_service.create(
        WorkItemLabelCreate(project_id=1, name="Backend", color="#2563eb"),
    )

    attached_label = label_service.add_to_work_item(
        work_item.id,
        WorkItemLabelAssign(label_id=label.id),
    )

    assert attached_label.id == label.id
    assert attached_label.name == "Backend"
    assert work_item.labels[0].id == label.id
