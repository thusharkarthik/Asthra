from app.schemas.attachment import WorkItemAttachmentCreate
from app.schemas.comment import WorkItemCommentCreate
from app.schemas.label import WorkItemLabelAssign, WorkItemLabelCreate
from app.services.attachment_service import AttachmentService
from app.services.comment_service import CommentService
from app.services.label_service import LabelService
from tests.conftest import create_work_item


def test_comments_labels_and_attachments(db):
    work_item = create_work_item(db, title="Flow collaboration target")

    comment = CommentService(db).create(
        work_item.id,
        WorkItemCommentCreate(author_user_id=1, body="Initial comment"),
    )
    assert comment.body == "Initial comment"
    assert len(CommentService(db).list_for_work_item(work_item.id)) == 1

    label_service = LabelService(db)
    label = label_service.create(
        WorkItemLabelCreate(project_id=1, name="Backend", color="#2563eb"),
    )
    attached_label = label_service.add_to_work_item(
        work_item.id,
        WorkItemLabelAssign(label_id=label.id),
    )
    assert attached_label.name == "Backend"

    attachment_service = AttachmentService(db)
    attachment = attachment_service.create(
        work_item.id,
        WorkItemAttachmentCreate(
            file_name="spec.pdf",
            file_url="https://files.example/spec.pdf",
            file_type="application/pdf",
            file_size=2048,
            uploaded_by_id=1,
        ),
    )
    assert attachment.file_name == "spec.pdf"
    assert len(attachment_service.list_for_work_item(work_item.id)) == 1
