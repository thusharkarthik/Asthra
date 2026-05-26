from app.schemas.comment import WorkItemCommentCreate
from app.schemas.work_item import WorkItemCreate
from app.services.comment_service import CommentService
from app.services.work_item_service import WorkItemService


def test_add_comment(db):
    work_item = WorkItemService(db).create(
        WorkItemCreate(
            project_id=1,
            title="Comment target",
            type_id=1,
            status_id=1,
            priority_id=1,
            reporter_id=1,
        ),
    )

    comment = CommentService(db).create(
        work_item.id,
        WorkItemCommentCreate(author_user_id=1, body="First comment"),
    )

    assert comment.id is not None
    assert comment.work_item_id == work_item.id
    assert comment.body == "First comment"
