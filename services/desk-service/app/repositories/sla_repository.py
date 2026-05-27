from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sla import SLA
from app.schemas.sla import SLACreate


class SLARepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: SLACreate) -> SLA:
        item = SLA(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, workspace_id: int | None = None) -> list[SLA]:
        stmt = select(SLA)
        if workspace_id is not None:
            stmt = stmt.where(SLA.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(SLA.id)).all())
