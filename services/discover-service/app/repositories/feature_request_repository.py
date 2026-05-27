from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.feature_request import FeatureRequest
from app.schemas.feature_request import FeatureRequestCreate, FeatureRequestUpdate


class FeatureRequestRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: FeatureRequestCreate) -> FeatureRequest:
        item = FeatureRequest(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id=None, status=None, source=None, limit=100, offset=0) -> list[FeatureRequest]:
        stmt = select(FeatureRequest)
        if workspace_id is not None:
            stmt = stmt.where(FeatureRequest.workspace_id == workspace_id)
        if status is not None:
            stmt = stmt.where(FeatureRequest.status == status)
        if source is not None:
            stmt = stmt.where(FeatureRequest.source == source)
        return list(self.db.scalars(stmt.order_by(FeatureRequest.id).limit(limit).offset(offset)).all())

    def get(self, item_id: int) -> FeatureRequest | None:
        return self.db.get(FeatureRequest, item_id)

    def update(self, item: FeatureRequest, data: FeatureRequestUpdate) -> FeatureRequest:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: FeatureRequest) -> None:
        self.db.delete(item)
        self.db.commit()
