from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.feature_request import FeatureRequest
from app.models.feedback import Feedback
from app.models.idea import Idea
from app.models.roadmap_item import RoadmapItem
from app.schemas.feature_request import FeatureRequestCreate
from app.schemas.feedback import FeedbackCreate
from app.schemas.idea import IdeaCreate
from app.schemas.roadmap_item import RoadmapItemCreate
from app.services.feature_request_service import FeatureRequestService
from app.services.feedback_service import FeedbackService
from app.services.idea_service import IdeaService
from app.services.roadmap_item_service import RoadmapItemService


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        idea = db.scalars(select(Idea).where(Idea.title == "Unified product discovery inbox")).first()
        if idea is None:
            idea = IdeaService(db).create(
                IdeaCreate(
                    workspace_id=1,
                    project_id=1,
                    title="Unified product discovery inbox",
                    description="Collect ideas, feedback, and feature requests in one place.",
                    problem_statement="Signals are spread across disconnected tools.",
                    target_users="Product managers, founders, and engineering leads",
                    status="exploring",
                    created_by_id=1,
                ),
            )
        feature_request = db.scalars(
            select(FeatureRequest).where(FeatureRequest.title == "Customer feedback import"),
        ).first()
        if feature_request is None:
            FeatureRequestService(db).create(
                FeatureRequestCreate(
                    idea_id=idea.id,
                    workspace_id=1,
                    title="Customer feedback import",
                    description="Import structured customer feedback into Discover.",
                    source="seed",
                    requested_by="sample-customer",
                    status="new",
                ),
            )

        feedback = db.scalars(
            select(Feedback).where(
                Feedback.idea_id == idea.id,
                Feedback.source == "interview",
                Feedback.author == "sample-user",
            ),
        ).first()
        if feedback is None:
            FeedbackService(db).create(
                FeedbackCreate(
                    workspace_id=1,
                    idea_id=idea.id,
                    source="interview",
                    author="sample-user",
                    content="We need a simple way to connect discovery notes to roadmap decisions.",
                    sentiment="positive",
                ),
            )

        roadmap_item = db.scalars(
            select(RoadmapItem).where(RoadmapItem.title == "Discovery inbox MVP"),
        ).first()
        if roadmap_item is None:
            RoadmapItemService(db).create(
                RoadmapItemCreate(
                    workspace_id=1,
                    idea_id=idea.id,
                    title="Discovery inbox MVP",
                    description="Ship initial idea, request, feedback, and roadmap workflows.",
                    target_quarter="2026-Q3",
                    status="planned",
                    sort_order=1,
                ),
            )
        print(f"Seeded Discover sample data for idea {idea.id}.")


if __name__ == "__main__":
    main()
