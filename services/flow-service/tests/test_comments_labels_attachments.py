import asyncio


from app.core.config import settings
from app.schemas.attachment import WorkItemAttachmentCreate
from app.schemas.comment import WorkItemCommentCreate
from app.schemas.label import WorkItemLabelAssign, WorkItemLabelCreate
from app.schemas.work_item import WorkItemCreate
from app.services.attachment_service import AttachmentService
from app.services.comment_service import CommentService
from app.services.label_service import LabelService
from app.services.work_item_service import WorkItemService
from tests.conftest import create_work_item


class FakeUploadFile:
    filename = "notes.txt"
    content_type = "text/plain"

    async def read(self):
        return b"hello attachment"


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


def test_attachment_upload_list_and_delete(db, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "attachment_storage_dir", str(tmp_path))
    work_item = create_work_item(db, title="Attachment target")
    upload = FakeUploadFile()

    attachment_service = AttachmentService(db)
    attachment = asyncio.run(attachment_service.create_from_upload(work_item.id, upload))

    assert attachment.file_name == "notes.txt"
    assert attachment.file_type == "text/plain"
    assert attachment.file_size == len(b"hello attachment")
    assert attachment.uploaded_by_id is None
    assert attachment_service.get_download_path(work_item.id, attachment.id).exists()
    assert len(attachment_service.list_for_work_item(work_item.id)) == 1

    attachment_service.delete(work_item.id, attachment.id)

    assert attachment_service.list_for_work_item(work_item.id) == []


def test_create_template_shaped_work_item(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)

    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=1,
            title="Bug from template",
            description="Problem Summary:\n\nEnvironment:\n\nSteps To Reproduce:\n",
            acceptance_criteria="- Issue is reproduced or root cause is confirmed.",
            definition_of_done="- Fix implemented\n- Tests pass",
        )
    )

    assert work_item.title == "Bug from template"
    assert work_item.description.startswith("Problem Summary")
    assert "Issue is reproduced" in work_item.acceptance_criteria


def test_create_comment_accepts_ui_payload_without_author(db):
    work_item = create_work_item(db, title="Comment target")

    comment = CommentService(db).create(
        work_item.id,
        WorkItemCommentCreate(content="Added from UI"),
    )

    assert comment.body == "Added from UI"
    assert comment.content == "Added from UI"
    assert comment.author_user_id == 0
    assert comment.user_id == 0
