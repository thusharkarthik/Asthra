from sqlalchemy.orm import Session

from app.repositories.queue_repository import QueueRepository
from app.schemas.queue import QueueCreate


class QueueService:
    def __init__(self, db: Session) -> None:
        self.repository = QueueRepository(db)

    def create(self, data: QueueCreate):
        return self.repository.create(data)

    def list(self, workspace_id: int | None = None):
        return self.repository.list(workspace_id)
