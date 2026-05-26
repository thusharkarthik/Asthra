from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item_label import WorkItemLabel
from app.repositories.label_repository import LabelRepository
from app.schemas.label import WorkItemLabelAssign, WorkItemLabelCreate


class LabelService:
    def __init__(self, db: Session) -> None:
        self.label_repository = LabelRepository(db)

    def create(self, label_create: WorkItemLabelCreate) -> WorkItemLabel:
        if self.label_repository.get_by_project_and_name(label_create.project_id, label_create.name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Label already exists for this project.",
            )
        return self.label_repository.create(label_create)

    def list(self, *, project_id: int | None = None) -> list[WorkItemLabel]:
        return self.label_repository.list(project_id=project_id)

    def add_to_work_item(
        self,
        work_item_id: int,
        label_assign: WorkItemLabelAssign,
    ) -> WorkItemLabel:
        work_item = self.label_repository.get_work_item(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )

        label = self.label_repository.get_by_id(label_assign.label_id)
        if label is None or not label.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")

        if label.project_id != work_item.project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Label must belong to the same project as the work item.",
            )

        if any(existing_label.id == label.id for existing_label in work_item.labels):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Label is already attached to this work item.",
            )

        return self.label_repository.add_label_to_work_item(work_item, label)
