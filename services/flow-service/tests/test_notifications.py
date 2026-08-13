from app.api.v1.notifications import delete_notification, list_notifications, mark_all_notifications_read, mark_notification_read
from app.schemas.comment import WorkItemCommentCreate
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate
from app.services.comment_service import CommentService
from app.services.notification_service import NotificationService
from app.services.work_item_service import WorkItemService


def test_status_priority_due_date_and_assignment_updates_create_notifications(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)
    work_item = service.create(WorkItemCreate(project_id=1, title="Notify me", assignee_id=11))

    service.update(
        work_item.id,
        WorkItemUpdate(
            status_name="in_progress",
            priority_name="high",
            assignee_id=12,
            due_date="2026-06-20T00:00:00Z",
        ),
    )

    notifications = NotificationService(db).list(project_id=1)
    notification_types = {notification.notification_type for notification in notifications}
    assert {"status_changed", "priority_changed", "work_item_assigned", "due_date_updated"}.issubset(notification_types)
    assert all(notification.work_item_id == work_item.id for notification in notifications)


def test_comment_added_creates_notification(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=1, title="Comment target", assignee_id=22))

    CommentService(db).create(work_item.id, WorkItemCommentCreate(content="Please review", user_id=7))

    notifications = NotificationService(db).list(project_id=1)
    assert len(notifications) == 1
    assert notifications[0].notification_type == "comment_added"
    assert notifications[0].user_id == 22
    assert notifications[0].is_read is False


def test_notification_read_all_and_delete_routes(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=1, title="Route target", assignee_id=2))
    first = NotificationService(db).create_for_work_item(
        work_item=work_item,
        notification_type="status_changed",
        title="Status changed",
        message="Status changed.",
        user_id=2,
    )
    NotificationService(db).create_for_work_item(
        work_item=work_item,
        notification_type="priority_changed",
        title="Priority changed",
        message="Priority changed.",
        user_id=2,
    )

    assert len(list_notifications(project_id=1, limit=50, offset=0, db=db)) == 2
    read = mark_notification_read(first.id, db=db)
    assert read.is_read is True
    mark_all_notifications_read(project_id=1, db=db)
    assert all(notification.is_read for notification in list_notifications(project_id=1, limit=50, offset=0, db=db))

    delete_notification(first.id, db=db)
    remaining = list_notifications(project_id=1, limit=50, offset=0, db=db)
    assert len(remaining) == 1
    assert remaining[0].id != first.id
