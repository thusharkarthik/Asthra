from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sprint import Sprint
from app.models.work_item import WorkItem
from app.schemas.sprint import SprintCreate, SprintUpdate


class SprintRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, sprint_create: SprintCreate) -> Sprint:
        sprint = Sprint(**sprint_create.model_dump())
        self.db.add(sprint)
        self.db.commit()
        self.db.refresh(sprint)
        return sprint

    def list(self, project_id: int | None = None, status: str | None = None, limit: int = 50, offset: int = 0) -> list[Sprint]:
        statement = select(Sprint).order_by(Sprint.id.desc()).offset(offset).limit(limit)
        if project_id is not None:
            statement = statement.where(Sprint.project_id == project_id)
        if status is not None:
            statement = statement.where(Sprint.status == status)
        return list(self.db.scalars(statement).all())

    def get(self, sprint_id: int) -> Sprint | None:
        return self.db.get(Sprint, sprint_id)

    def update(self, sprint: Sprint, sprint_update: SprintUpdate) -> Sprint:
        update_data = sprint_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sprint, field, value)
        self.db.add(sprint)
        self.db.commit()
        self.db.refresh(sprint)
        return sprint

    def delete(self, sprint: Sprint) -> None:
        for work_item in self.list_work_items(sprint.id):
            work_item.sprint_id = None
            self.db.add(work_item)
        self.db.delete(sprint)
        self.db.commit()

    def list_work_items(self, sprint_id: int) -> list[WorkItem]:
        return list(self.db.scalars(select(WorkItem).where(WorkItem.sprint_id == sprint_id, WorkItem.is_active.is_(True)).order_by(WorkItem.id)).all())
