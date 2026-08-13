from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.feature_request import FeatureRequest
from app.repositories.feature_request_repository import FeatureRequestRepository
from app.schemas.feature_request import FeatureRequestCreate, FeatureRequestUpdate
from app.services.idea_service import IdeaService


class FeatureRequestService:
    def __init__(self, db: Session) -> None:
        self.repository = FeatureRequestRepository(db)
        self.idea_service = IdeaService(db)

    def create(self, data: FeatureRequestCreate) -> FeatureRequest:
        if data.idea_id is not None:
            self.idea_service.get(data.idea_id)
        return self.repository.create(data)

    def list(self, **filters) -> list[FeatureRequest]:
        return self.repository.list(**filters)

    def get(self, item_id: int) -> FeatureRequest:
        item = self.repository.get(item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature request not found.")
        return item

    def update(self, item_id: int, data: FeatureRequestUpdate) -> FeatureRequest:
        if data.idea_id is not None:
            self.idea_service.get(data.idea_id)
        return self.repository.update(self.get(item_id), data)

    def delete(self, item_id: int) -> None:
        self.repository.delete(self.get(item_id))
