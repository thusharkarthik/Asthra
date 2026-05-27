from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.repositories.feedback_repository import FeedbackRepository
from app.schemas.feedback import FeedbackCreate
from app.services.feature_request_service import FeatureRequestService
from app.services.idea_service import IdeaService


class FeedbackService:
    def __init__(self, db: Session) -> None:
        self.repository = FeedbackRepository(db)
        self.idea_service = IdeaService(db)
        self.feature_request_service = FeatureRequestService(db)

    def create(self, data: FeedbackCreate) -> Feedback:
        if data.idea_id is not None:
            self.idea_service.get(data.idea_id)
        if data.feature_request_id is not None:
            self.feature_request_service.get(data.feature_request_id)
        return self.repository.create(data)

    def list(self, *, workspace_id: int | None = None, limit: int = 100, offset: int = 0) -> list[Feedback]:
        return self.repository.list(workspace_id=workspace_id, limit=limit, offset=offset)
