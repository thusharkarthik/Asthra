from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.change_request import ChangeRequest
from app.schemas.change_request import ChangeRequestCreate, ChangeRequestUpdate


class ChangeRequestRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: ChangeRequestCreate) -> ChangeRequest:
        item = ChangeRequest(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, workspace_id: int | None = None) -> list[ChangeRequest]:
        stmt = select(ChangeRequest)
        if workspace_id is not None:
            stmt = stmt.where(ChangeRequest.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(ChangeRequest.id)).all())

    def get(self, item_id: int) -> ChangeRequest | None:
        return self.db.get(ChangeRequest, item_id)

    def update(self, item: ChangeRequest, data: ChangeRequestUpdate) -> ChangeRequest:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
