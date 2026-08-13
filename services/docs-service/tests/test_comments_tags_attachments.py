from app.schemas.attachment import PageAttachmentCreate
from app.schemas.comment import PageCommentCreate
from app.schemas.tag import PageTagAssign, PageTagCreate
from app.services.attachment_service import AttachmentService
from app.services.comment_service import CommentService
from app.services.tag_service import TagService
from tests.conftest import create_page


def test_comments_tags_and_attachments(db):
    page = create_page(db)

    comment_service = CommentService(db)
    comment = comment_service.create(
        page.id,
        PageCommentCreate(user_id=1, content="Initial comment"),
    )
    assert comment.content == "Initial comment"
    assert len(comment_service.list_for_page(page.id)) == 1

    attachment_service = AttachmentService(db)
    attachment = attachment_service.create(
        page.id,
        PageAttachmentCreate(
            file_name="architecture.pdf",
            file_url="https://files.example/architecture.pdf",
            file_type="application/pdf",
            file_size=2048,
            uploaded_by_id=1,
        ),
    )
    assert attachment.file_name == "architecture.pdf"
    assert len(attachment_service.list_for_page(page.id)) == 1

    tag_service = TagService(db)
    tag = tag_service.create(PageTagCreate(name="engineering"))
    assert tag.name == "engineering"
    assert len(tag_service.list()) == 1

    attached_tag = tag_service.add_to_page(page.id, PageTagAssign(tag_id=tag.id))
    assert attached_tag.id == tag.id
    assert len(tag_service.list_for_page(page.id)) == 1
