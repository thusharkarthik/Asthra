from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.release import Release
from app.models.work_item import WorkItem
from app.repositories.release_repository import ReleaseRepository
from app.repositories.work_item_repository import WorkItemRepository
from app.schemas.release import ReleaseCreate, ReleaseRead, ReleaseUpdate
from app.schemas.work_item import WorkItemUpdate


class ReleaseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.release_repository = ReleaseRepository(db)
        self.work_item_repository = WorkItemRepository(db)

    def create(self, release_create: ReleaseCreate) -> ReleaseRead:
        return self.to_read(self.release_repository.create(release_create))

    def list(self, project_id: int | None = None, status_filter: str | None = None, limit: int = 50, offset: int = 0) -> list[ReleaseRead]:
        return [self.to_read(release) for release in self.release_repository.list(project_id=project_id, status=status_filter, limit=limit, offset=offset)]

    def get(self, release_id: int) -> ReleaseRead:
        return self.to_read(self.get_model(release_id))

    def update(self, release_id: int, release_update: ReleaseUpdate) -> ReleaseRead:
        return self.to_read(self.release_repository.update(self.get_model(release_id), release_update))

    def delete(self, release_id: int) -> None:
        self.release_repository.delete(self.get_model(release_id))

    def activate(self, release_id: int) -> ReleaseRead:
        release = self.get_model(release_id)
        if release.status not in {"planned", "cancelled"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only planned or cancelled releases can be activated.")
        return self.to_read(self.release_repository.update(release, ReleaseUpdate(status="active")))

    def release(self, release_id: int) -> ReleaseRead:
        release = self.get_model(release_id)
        if release.status != "active":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active releases can be marked released.")
        return self.to_read(
            self.release_repository.update(
                release,
                ReleaseUpdate(status="released", actual_release_date=release.actual_release_date or datetime.now(UTC)),
            )
        )

    def assign_work_item(self, release_id: int, work_item_id: int) -> ReleaseRead:
        release = self.get_model(release_id)
        work_item = self.work_item_repository.get_by_id(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item not found.")
        if work_item.project_id != release.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Work item must belong to the release project.")
        self.work_item_repository.update(work_item, WorkItemUpdate(release_id=release.id))
        return self.to_read(self.get_model(release_id))

    def get_model(self, release_id: int) -> Release:
        release = self.release_repository.get(release_id)
        if release is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Release not found.")
        return release

    def to_read(self, release: Release) -> ReleaseRead:
        work_items = self.release_repository.list_work_items(release.id)
        completed_count = len([work_item for work_item in work_items if self.is_completed(work_item)])
        completion_percentage = round((completed_count / len(work_items)) * 100) if work_items else 0
        return ReleaseRead(
            id=release.id,
            created_at=release.created_at,
            updated_at=release.updated_at,
            project_id=release.project_id,
            name=release.name,
            version=release.version,
            description=release.description,
            target_date=release.target_date,
            actual_release_date=release.actual_release_date,
            status=release.status,
            work_item_count=len(work_items),
            completed_work_count=completed_count,
            completion_percentage=completion_percentage,
        )

    @staticmethod
    def is_completed(work_item: WorkItem) -> bool:
        status_model = getattr(work_item, "status", None)
        if status_model is not None:
            return status_model.category == "completed" or status_model.name.lower() == "done"
        return False
