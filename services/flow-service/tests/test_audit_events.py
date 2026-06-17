from app.api.v1.audit_events import list_audit_events, list_work_item_audit_events
from app.schemas.attachment import WorkItemAttachmentCreate
from app.schemas.comment import WorkItemCommentCreate, WorkItemCommentUpdate
from app.schemas.work_item import LinkedEntityCreate, WorkItemCreate, WorkItemRelationCreate, WorkItemUpdate
from app.services.attachment_service import AttachmentService
from app.services.audit_service import AuditService
from app.services.comment_service import CommentService
from app.services.work_item_service import WorkItemService


def test_work_item_create_update_and_archive_records_audit_events(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    service = WorkItemService(db)

    work_item = service.create(WorkItemCreate(project_id=42, title="Audit this", assignee_id=7))
    service.update(
        work_item.id,
        WorkItemUpdate(
            title="Audited work",
            status_name="in_progress",
            priority_name="high",
            assignee_id=8,
            due_date="2026-06-18T10:20:00Z",
        ),
    )
    service.delete(work_item.id)

    actions = [event.action for event in AuditService(db).list(project_id=42, limit=50)]
    assert "work_item.created" in actions
    assert "work_item.updated" in actions
    assert "status.changed" in actions
    assert "priority.changed" in actions
    assert "assignee.changed" in actions
    assert "due_date.updated" in actions
    assert "work_item.archived" in actions


def test_comment_create_edit_delete_records_audit_events(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Comment audit"))
    service = CommentService(db)

    comment = service.create(work_item.id, WorkItemCommentCreate(author_user_id=3, body="Initial comment"))
    service.update(work_item.id, comment.id, WorkItemCommentUpdate(body="Edited comment"))
    service.delete(work_item.id, comment.id)

    events = AuditService(db).list(work_item_id=work_item.id, limit=50)
    actions = [event.action for event in events]
    assert "comment.added" in actions
    assert "comment.edited" in actions
    assert "comment.deleted" in actions
    edited = next(event for event in events if event.action == "comment.edited")
    assert edited.old_value == "Initial comment"
    assert edited.new_value == "Edited comment"


def test_attachment_relation_and_link_actions_record_audit_events(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_items = WorkItemService(db)
    source = work_items.create(WorkItemCreate(project_id=42, title="Source"))
    target = work_items.create(WorkItemCreate(project_id=42, title="Target"))

    attachment = AttachmentService(db).create(
        source.id,
        WorkItemAttachmentCreate(
            file_name="design.pdf",
            file_url="/tmp/design.pdf",
            file_type="application/pdf",
            file_size=2048,
            uploaded_by_id=5,
        ),
    )
    AttachmentService(db).delete(source.id, attachment.id)
    relation = work_items.create_relation(
        source.id,
        WorkItemRelationCreate(target_work_item_id=target.id, relation_type="blocks", created_by_id=6),
    )
    work_items.delete_relation(source.id, relation.id)
    link = work_items.create_link(
        source.id,
        LinkedEntityCreate(entity_type="doc_page", entity_id="page-1", entity_title="Architecture Notes"),
    )
    work_items.delete_link(source.id, link.id)

    actions = [event.action for event in AuditService(db).list(work_item_id=source.id, limit=50)]
    assert "attachment.uploaded" in actions
    assert "attachment.deleted" in actions
    assert "relation.added" in actions
    assert "relation.removed" in actions
    assert "link.linked" in actions
    assert "link.unlinked" in actions


def test_audit_event_routes_filter_project_work_item_actor_and_action(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Route filter", assignee_id=7))
    WorkItemService(db).update(work_item.id, WorkItemUpdate(assignee_id=9))

    project_events = list_audit_events(project_id=42, limit=50, offset=0, db=db)
    assert project_events
    assert {event.project_id for event in project_events} == {42}

    action_events = list_audit_events(action="assignee.changed", limit=50, offset=0, db=db)
    assert len(action_events) == 1
    assert action_events[0].old_value == "7"
    assert action_events[0].new_value == "9"

    work_item_events = list_work_item_audit_events(work_item.id, limit=50, offset=0, db=db)
    assert {event.work_item_id for event in work_item_events} == {work_item.id}
