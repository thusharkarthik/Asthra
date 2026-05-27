from app.schemas.schemas import AccessReviewCreate
from app.services.access_review_service import AccessReviewService


def test_create_list_get_update_access_review(db):
    service = AccessReviewService(db)
    review = service.create(
        AccessReviewCreate(workspace_id=1, name="Quarterly access review", reviewer_id=2).model_dump()
    )
    assert len(service.list(workspace_id=1, reviewer_id=2)) == 1
    assert service.get(review.id).name == "Quarterly access review"
    assert service.update(review.id, {"status": "in_progress"}).status == "in_progress"
