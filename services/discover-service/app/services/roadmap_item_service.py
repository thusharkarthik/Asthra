from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.roadmap_item import RoadmapItem
from app.repositories.roadmap_item_repository import RoadmapItemRepository
from app.schemas.roadmap_item import RoadmapItemCreate, RoadmapItemUpdate
from app.services.idea_service import IdeaService


class RoadmapItemService:
    def __init__(self, db: Session) -> None:
        self.repository = RoadmapItemRepository(db)
        self.idea_service = IdeaService(db)

    def create(self, data: RoadmapItemCreate) -> RoadmapItem:
        if data.idea_id is not None:
            self.idea_service.get(data.idea_id)
        return self.repository.create(data)

    def list(self, **filters) -> list[RoadmapItem]:
        return self.repository.list(**filters)

    def get(self, item_id: int) -> RoadmapItem:
        item = self.repository.get(item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found.")
        return item

    def update(self, item_id: int, data: RoadmapItemUpdate) -> RoadmapItem:
        if data.idea_id is not None:
            self.idea_service.get(data.idea_id)
        return self.repository.update(self.get(item_id), data)

    def delete(self, item_id: int) -> None:
        self.repository.delete(self.get(item_id))
