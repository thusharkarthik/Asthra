from sqlalchemy.orm import Session

from app.repositories.sla_repository import SLARepository
from app.schemas.sla import SLACreate


class SLAService:
    def __init__(self, db: Session) -> None:
        self.repository = SLARepository(db)

    def create(self, data: SLACreate):
        return self.repository.create(data)

    def list(self, workspace_id: int | None = None):
        return self.repository.list(workspace_id)
