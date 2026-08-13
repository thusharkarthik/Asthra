from app.schemas.feature_request import FeatureRequestCreate
from app.services.feature_request_service import FeatureRequestService

from .conftest import create_idea


def test_create_and_list_feature_request(db):
    idea = create_idea(db)
    request = FeatureRequestService(db).create(
        FeatureRequestCreate(
            idea_id=idea.id,
            workspace_id=1,
            title="Import feedback",
            description="Import customer feedback into Discover.",
            source="customer",
            requested_by="Acme",
            status="new",
        ),
    )

    requests = FeatureRequestService(db).list(workspace_id=1, status="new", source="customer", limit=10, offset=0)
    assert [item.id for item in requests] == [request.id]
