from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.schemas.idea import IdeaCreate, IdeaUpdate


class IdeaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: IdeaCreate) -> Idea:
        item = Idea(**data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(self, *, workspace_id=None, project_id=None, status=None, created_by_id=None, limit=100, offset=0) -> list[Idea]:
        stmt = select(Idea)
        if workspace_id is not None:
            stmt = stmt.where(Idea.workspace_id == workspace_id)
        if project_id is not None:
            stmt = stmt.where(Idea.project_id == project_id)
        if status is not None:
            stmt = stmt.where(Idea.status == status)
        if created_by_id is not None:
            stmt = stmt.where(Idea.created_by_id == created_by_id)
        return list(self.db.scalars(stmt.order_by(Idea.id).limit(limit).offset(offset)).all())

    def get(self, item_id: int) -> Idea | None:
        return self.db.get(Idea, item_id)

    def update(self, item: Idea, data: IdeaUpdate) -> Idea:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: Idea) -> None:
        self.db.delete(item)
        self.db.commit()
