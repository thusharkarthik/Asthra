from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.roadmap_item import RoadmapItem
from app.schemas.roadmap_item import RoadmapItemCreate, RoadmapItemUpdate


class RoadmapItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: RoadmapItemCreate) -> RoadmapItem:
        item = RoadmapItem(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id=None, status=None, target_quarter=None, limit=100, offset=0) -> list[RoadmapItem]:
        stmt = select(RoadmapItem)
        if workspace_id is not None:
            stmt = stmt.where(RoadmapItem.workspace_id == workspace_id)
        if status is not None:
            stmt = stmt.where(RoadmapItem.status == status)
        if target_quarter is not None:
            stmt = stmt.where(RoadmapItem.target_quarter == target_quarter)
        return list(self.db.scalars(stmt.order_by(RoadmapItem.sort_order, RoadmapItem.id).limit(limit).offset(offset)).all())

    def get(self, item_id: int) -> RoadmapItem | None:
        return self.db.get(RoadmapItem, item_id)

    def update(self, item: RoadmapItem, data: RoadmapItemUpdate) -> RoadmapItem:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: RoadmapItem) -> None:
        self.db.delete(item)
        self.db.commit()
