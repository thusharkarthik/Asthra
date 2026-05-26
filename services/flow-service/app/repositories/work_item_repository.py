from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.board import Board, BoardColumn
from app.models.work_item import WorkItem
from app.models.work_item_priority import WorkItemPriority
from app.models.work_item_status import WorkItemStatus
from app.models.work_item_type import WorkItemType
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate


class WorkItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, work_item_create: WorkItemCreate) -> WorkItem:
        work_item = WorkItem(**work_item_create.model_dump())
        self.db.add(work_item)
        self.db.commit()
        self.db.refresh(work_item)
        return work_item

    def list(
        self,
        *,
        status_id: int | None = None,
        assignee_id: int | None = None,
        project_id: int | None = None,
        priority_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[WorkItem]:
        statement = select(WorkItem).where(WorkItem.is_active.is_(True))
        if status_id is not None:
            statement = statement.where(WorkItem.status_id == status_id)
        if assignee_id is not None:
            statement = statement.where(WorkItem.assignee_id == assignee_id)
        if project_id is not None:
            statement = statement.where(WorkItem.project_id == project_id)
        if priority_id is not None:
            statement = statement.where(WorkItem.priority_id == priority_id)
        statement = statement.order_by(WorkItem.id).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, work_item_id: int) -> WorkItem | None:
        return self.db.get(WorkItem, work_item_id)

    def update(self, work_item: WorkItem, work_item_update: WorkItemUpdate) -> WorkItem:
        update_data = work_item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(work_item, field, value)
        self.db.add(work_item)
        self.db.commit()
        self.db.refresh(work_item)
        return work_item

    def delete(self, work_item: WorkItem) -> None:
        work_item.is_active = False
        self.db.add(work_item)
        self.db.commit()

    def type_exists(self, type_id: int) -> bool:
        return self.db.get(WorkItemType, type_id) is not None

    def status_exists(self, status_id: int) -> bool:
        return self.db.get(WorkItemStatus, status_id) is not None

    def priority_exists(self, priority_id: int) -> bool:
        return self.db.get(WorkItemPriority, priority_id) is not None

    def get_board(self, board_id: int) -> Board | None:
        return self.db.get(Board, board_id)

    def get_board_column(self, board_column_id: int) -> BoardColumn | None:
        return self.db.get(BoardColumn, board_column_id)
