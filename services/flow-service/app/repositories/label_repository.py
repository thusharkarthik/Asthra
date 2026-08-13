from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.models.work_item_label import WorkItemLabel
from app.schemas.label import WorkItemLabelCreate


class LabelRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, label_create: WorkItemLabelCreate) -> WorkItemLabel:
        label = WorkItemLabel(**label_create.model_dump())
        self.db.add(label)
        self.db.commit()
        self.db.refresh(label)
        return label

    def list(self, *, project_id: int | None = None) -> list[WorkItemLabel]:
        statement = select(WorkItemLabel).where(WorkItemLabel.is_active.is_(True))
        if project_id is not None:
            statement = statement.where(WorkItemLabel.project_id == project_id)
        statement = statement.order_by(WorkItemLabel.name)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, label_id: int) -> WorkItemLabel | None:
        return self.db.get(WorkItemLabel, label_id)

    def get_work_item(self, work_item_id: int) -> WorkItem | None:
        return self.db.get(WorkItem, work_item_id)

    def get_by_project_and_name(self, project_id: int, name: str) -> WorkItemLabel | None:
        statement = select(WorkItemLabel).where(
            WorkItemLabel.project_id == project_id,
            func.lower(WorkItemLabel.name) == name.strip().lower(),
            WorkItemLabel.is_active.is_(True),
        )
        return self.db.scalars(statement).first()

    def add_label_to_work_item(self, work_item: WorkItem, label: WorkItemLabel) -> WorkItemLabel:
        work_item.labels.append(label)
        self.db.add(work_item)
        self.db.commit()
        self.db.refresh(label)
        return label
