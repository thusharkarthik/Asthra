from app.schemas.feedback import FeedbackCreate
from app.services.feedback_service import FeedbackService

from .conftest import create_idea


def test_create_and_list_feedback(db):
    idea = create_idea(db)
    feedback = FeedbackService(db).create(
        FeedbackCreate(
            workspace_id=1,
            idea_id=idea.id,
            source="interview",
            author="user@example.com",
            content="This would save planning time.",
            sentiment="positive",
        ),
    )

    items = FeedbackService(db).list(workspace_id=1, limit=10, offset=0)
    assert [item.id for item in items] == [feedback.id]
