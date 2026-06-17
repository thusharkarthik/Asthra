from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.release import Release
from app.models.work_item import WorkItem
from app.schemas.release import ReleaseCreate, ReleaseUpdate


class ReleaseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, release_create: ReleaseCreate) -> Release:
        release = Release(**release_create.model_dump())
        self.db.add(release)
        self.db.commit()
        self.db.refresh(release)
        return release

    def list(self, project_id: int | None = None, status: str | None = None, limit: int = 50, offset: int = 0) -> list[Release]:
        statement = select(Release).order_by(Release.target_date.is_(None), Release.target_date, Release.id.desc()).offset(offset).limit(limit)
        if project_id is not None:
            statement = statement.where(Release.project_id == project_id)
        if status is not None:
            statement = statement.where(Release.status == status)
        return list(self.db.scalars(statement).all())

    def get(self, release_id: int) -> Release | None:
        return self.db.get(Release, release_id)

    def update(self, release: Release, release_update: ReleaseUpdate) -> Release:
        update_data = release_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(release, field, value)
        self.db.add(release)
        self.db.commit()
        self.db.refresh(release)
        return release

    def delete(self, release: Release) -> None:
        for work_item in self.list_work_items(release.id):
            work_item.release_id = None
            self.db.add(work_item)
        self.db.delete(release)
        self.db.commit()

    def list_work_items(self, release_id: int) -> list[WorkItem]:
        statement = (
            select(WorkItem)
            .where(WorkItem.release_id == release_id, WorkItem.is_active.is_(True))
            .order_by(WorkItem.id)
        )
        return list(self.db.scalars(statement).all())
