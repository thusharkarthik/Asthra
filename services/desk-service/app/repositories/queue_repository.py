from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_queue import ServiceQueue
from app.schemas.queue import QueueCreate


class QueueRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: QueueCreate) -> ServiceQueue:
        item = ServiceQueue(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, workspace_id: int | None = None) -> list[ServiceQueue]:
        stmt = select(ServiceQueue)
        if workspace_id is not None:
            stmt = stmt.where(ServiceQueue.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(ServiceQueue.id)).all())

    def get(self, item_id: int) -> ServiceQueue | None:
        return self.db.get(ServiceQueue, item_id)
