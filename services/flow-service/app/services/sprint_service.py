from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.sprint import Sprint
from app.models.work_item import WorkItem
from app.repositories.sprint_repository import SprintRepository
from app.repositories.work_item_repository import WorkItemRepository
from app.schemas.sprint import SprintCreate, SprintRead, SprintUpdate
from app.schemas.work_item import WorkItemUpdate


class SprintService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sprint_repository = SprintRepository(db)
        self.work_item_repository = WorkItemRepository(db)

    def create(self, sprint_create: SprintCreate) -> SprintRead:
        return self.to_read(self.sprint_repository.create(sprint_create))

    def list(self, project_id: int | None = None, status_filter: str | None = None, limit: int = 50, offset: int = 0) -> list[SprintRead]:
        return [self.to_read(sprint) for sprint in self.sprint_repository.list(project_id=project_id, status=status_filter, limit=limit, offset=offset)]

    def get(self, sprint_id: int) -> SprintRead:
        return self.to_read(self.get_model(sprint_id))

    def update(self, sprint_id: int, sprint_update: SprintUpdate) -> SprintRead:
        return self.to_read(self.sprint_repository.update(self.get_model(sprint_id), sprint_update))

    def delete(self, sprint_id: int) -> None:
        self.sprint_repository.delete(self.get_model(sprint_id))

    def start(self, sprint_id: int) -> SprintRead:
        sprint = self.get_model(sprint_id)
        if sprint.status not in {"planned", "cancelled"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only planned or cancelled sprints can be started.")
        return self.to_read(self.sprint_repository.update(sprint, SprintUpdate(status="active")))

    def complete(self, sprint_id: int) -> SprintRead:
        sprint = self.get_model(sprint_id)
        if sprint.status != "active":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active sprints can be completed.")
        return self.to_read(self.sprint_repository.update(sprint, SprintUpdate(status="completed")))

    def assign_work_item(self, sprint_id: int, work_item_id: int) -> SprintRead:
        sprint = self.get_model(sprint_id)
        work_item = self.work_item_repository.get_by_id(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item not found.")
        if work_item.project_id != sprint.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Work item must belong to the sprint project.")
        self.work_item_repository.update(work_item, WorkItemUpdate(sprint_id=sprint.id))
        return self.to_read(self.get_model(sprint_id))

    def get_model(self, sprint_id: int) -> Sprint:
        sprint = self.sprint_repository.get(sprint_id)
        if sprint is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")
        return sprint

    def to_read(self, sprint: Sprint) -> SprintRead:
        work_items = self.sprint_repository.list_work_items(sprint.id)
        completed_count = len([work_item for work_item in work_items if self.is_completed(work_item)])
        return SprintRead(
            id=sprint.id,
            created_at=sprint.created_at,
            updated_at=sprint.updated_at,
            project_id=sprint.project_id,
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            status=sprint.status,
            planned_work_count=len(work_items),
            completed_work_count=completed_count,
            total_effort=sum(work_item.effort_score or 0 for work_item in work_items),
        )

    @staticmethod
    def is_completed(work_item: WorkItem) -> bool:
        status_model = getattr(work_item, "status", None)
        if status_model is not None:
            return status_model.category == "completed" or status_model.name.lower() == "done"
        return False
