from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.board import Board, BoardColumn
from app.models.linked_entity import LinkedEntity
from app.models.work_item import WorkItem
from app.models.work_item_comment import WorkItemComment
from app.models.work_item_priority import WorkItemPriority
from app.models.work_item_relation import WorkItemRelation
from app.models.work_item_status import WorkItemStatus
from app.models.work_item_type import WorkItemType
from app.schemas.work_item import LinkedEntityCreate, WorkItemCreate, WorkItemRelationCreate, WorkItemUpdate
from app.schemas.search import WorkItemSearchParams


class WorkItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, work_item_create: WorkItemCreate) -> WorkItem:
        work_item = WorkItem(**work_item_create.model_dump(exclude={"status_name", "priority_name"}))
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
        sprint_id: int | None = None,
        release_id: int | None = None,
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
        if sprint_id is not None:
            statement = statement.where(WorkItem.sprint_id == sprint_id)
        if release_id is not None:
            statement = statement.where(WorkItem.release_id == release_id)
        statement = statement.order_by(WorkItem.id).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def search(self, params: WorkItemSearchParams) -> tuple[list[WorkItem], int]:
        statement = select(WorkItem).where(WorkItem.is_active.is_(True))
        if params.text:
            pattern = f"%{params.text}%"
            comment_ids = select(WorkItemComment.work_item_id).where(
                WorkItemComment.is_active.is_(True),
                WorkItemComment.body.ilike(pattern),
            )
            statement = statement.where(
                or_(
                    WorkItem.title.ilike(pattern),
                    WorkItem.description.ilike(pattern),
                    WorkItem.id.in_(comment_ids),
                )
            )
        if params.title:
            statement = statement.where(WorkItem.title.ilike(f"%{params.title}%"))
        if params.description:
            statement = statement.where(WorkItem.description.ilike(f"%{params.description}%"))
        if params.status:
            statement = self._filter_status(statement, params.status)
        if params.priority:
            statement = self._filter_priority(statement, params.priority)
        exact_filters = {
            "assignee_id": params.assignee_id,
            "reporter_id": params.reporter_id,
            "effort_size": params.effort_size,
            "business_value": params.business_value,
            "risk_level": params.risk_level,
            "complexity": params.complexity,
            "sprint_id": params.sprint_id,
            "release_id": params.release_id,
            "parent_id": params.parent_id,
            "item_level": params.item_level,
            "project_id": params.project_id,
        }
        for field, value in exact_filters.items():
            if value is not None:
                statement = statement.where(getattr(WorkItem, field) == value)
        if params.created_after is not None:
            statement = statement.where(WorkItem.created_at >= params.created_after)
        if params.created_before is not None:
            statement = statement.where(WorkItem.created_at <= params.created_before)
        if params.updated_after is not None:
            statement = statement.where(WorkItem.updated_at >= params.updated_after)
        if params.updated_before is not None:
            statement = statement.where(WorkItem.updated_at <= params.updated_before)
        if params.due_after is not None:
            statement = statement.where(WorkItem.due_date >= params.due_after)
        if params.due_before is not None:
            statement = statement.where(WorkItem.due_date <= params.due_before)

        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        sort_column = {
            "created_at": WorkItem.created_at,
            "updated_at": WorkItem.updated_at,
            "priority": WorkItem.priority_id,
            "due_date": WorkItem.due_date,
        }[params.sort_by]
        if params.sort_direction == "desc":
            sort_column = sort_column.desc()
        statement = statement.order_by(sort_column, WorkItem.id).offset((params.page - 1) * params.page_size).limit(params.page_size)
        return list(self.db.scalars(statement).all()), total

    def get_by_id(self, work_item_id: int) -> WorkItem | None:
        return self.db.get(WorkItem, work_item_id)

    def list_by_project(self, project_id: int) -> list[WorkItem]:
        statement = (
            select(WorkItem)
            .where(WorkItem.project_id == project_id, WorkItem.is_active.is_(True))
            .order_by(WorkItem.item_level, WorkItem.id)
        )
        return list(self.db.scalars(statement).all())

    def list_children(self, work_item_id: int) -> list[WorkItem]:
        statement = (
            select(WorkItem)
            .where(WorkItem.parent_id == work_item_id, WorkItem.is_active.is_(True))
            .order_by(WorkItem.id)
        )
        return list(self.db.scalars(statement).all())

    def update(self, work_item: WorkItem, work_item_update: WorkItemUpdate) -> WorkItem:
        update_data = work_item_update.model_dump(
            exclude_unset=True,
            exclude={"status_name", "priority_name"},
        )
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

    def create_relation(self, source_work_item_id: int, relation_create: WorkItemRelationCreate) -> WorkItemRelation:
        relation = WorkItemRelation(
            source_work_item_id=source_work_item_id,
            target_work_item_id=relation_create.target_work_item_id,
            relation_type=relation_create.relation_type,
            description=relation_create.description,
            created_by_id=relation_create.created_by_id,
        )
        self.db.add(relation)
        self.db.commit()
        self.db.refresh(relation)
        return relation

    def list_relations(self, work_item_id: int) -> list[WorkItemRelation]:
        statement = (
            select(WorkItemRelation)
            .where(
                (WorkItemRelation.source_work_item_id == work_item_id)
                | (WorkItemRelation.target_work_item_id == work_item_id)
            )
            .order_by(WorkItemRelation.id)
        )
        return list(self.db.scalars(statement).all())

    def get_relation(self, relation_id: int) -> WorkItemRelation | None:
        return self.db.get(WorkItemRelation, relation_id)

    def delete_relation(self, relation: WorkItemRelation) -> None:
        self.db.delete(relation)
        self.db.commit()

    def create_link(self, work_item_id: int, link_create: LinkedEntityCreate) -> LinkedEntity:
        link = LinkedEntity(work_item_id=work_item_id, **link_create.model_dump())
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link

    def list_links(self, work_item_id: int) -> list[LinkedEntity]:
        statement = (
            select(LinkedEntity)
            .where(LinkedEntity.work_item_id == work_item_id)
            .order_by(LinkedEntity.entity_type, LinkedEntity.id)
        )
        return list(self.db.scalars(statement).all())

    def get_link(self, link_id: int) -> LinkedEntity | None:
        return self.db.get(LinkedEntity, link_id)

    def delete_link(self, link: LinkedEntity) -> None:
        self.db.delete(link)
        self.db.commit()

    def type_exists(self, type_id: int) -> bool:
        return self.db.get(WorkItemType, type_id) is not None

    def status_exists(self, status_id: int) -> bool:
        return self.db.get(WorkItemStatus, status_id) is not None

    def priority_exists(self, priority_id: int) -> bool:
        return self.db.get(WorkItemPriority, priority_id) is not None

    def get_or_create_default_type(self) -> WorkItemType:
        work_item_type = self.db.scalar(select(WorkItemType).where(WorkItemType.name == "task"))
        if work_item_type is None:
            work_item_type = WorkItemType(name="task", description="Default task work item", icon="check-square")
            self.db.add(work_item_type)
            self.db.flush()
        return work_item_type

    def get_or_create_default_status(self) -> WorkItemStatus:
        status = self.get_or_create_status_by_name("todo")
        return status

    def get_or_create_status_by_name(self, name: str) -> WorkItemStatus:
        normalized = name.strip().lower().replace("_", " ")
        canonical = {
            "todo": ("todo", "todo", 0),
            "to do": ("todo", "todo", 0),
            "in progress": ("in_progress", "in_progress", 1),
            "review": ("review", "review", 2),
            "done": ("done", "done", 3),
        }.get(normalized, (normalized.replace(" ", "_"), normalized.replace(" ", "_"), 0))
        status = self.db.scalar(select(WorkItemStatus).where(WorkItemStatus.name == canonical[0]))
        if status is None:
            status = WorkItemStatus(
                name=canonical[0],
                description=f"Default {canonical[0].replace('_', ' ')} status",
                category=canonical[1],
                sort_order=canonical[2],
            )
            self.db.add(status)
            self.db.flush()
        return status

    def get_or_create_default_priority(self) -> WorkItemPriority:
        priority = self.get_or_create_priority_by_name("medium")
        return priority

    def get_or_create_priority_by_name(self, name: str) -> WorkItemPriority:
        normalized = name.strip().lower().replace("_", " ")
        canonical = {
            "low": ("low", 1),
            "medium": ("medium", 2),
            "high": ("high", 3),
            "critical": ("critical", 4),
        }.get(normalized, (normalized.replace(" ", "_"), 0))
        priority = self.db.scalar(select(WorkItemPriority).where(WorkItemPriority.name == canonical[0]))
        if priority is None:
            priority = WorkItemPriority(
                name=canonical[0],
                description=f"Default {canonical[0].replace('_', ' ')} priority",
                level=canonical[1],
            )
            self.db.add(priority)
            self.db.flush()
        return priority

    def _filter_status(self, statement, value: str):
        if value.isdigit():
            return statement.where(WorkItem.status_id == int(value))
        normalized = value.strip().lower().replace(" ", "_").replace("-", "_")
        status = self.db.scalar(
            select(WorkItemStatus).where((WorkItemStatus.name == value) | (WorkItemStatus.key == normalized))
        )
        if status is None:
            return statement.where(WorkItem.status_id == -1)
        return statement.where(WorkItem.status_id == status.id)

    def _filter_priority(self, statement, value: str):
        if value.isdigit():
            return statement.where(WorkItem.priority_id == int(value))
        priority = self.db.scalar(select(WorkItemPriority).where(WorkItemPriority.name == value))
        if priority is None:
            return statement.where(WorkItem.priority_id == -1)
        return statement.where(WorkItem.priority_id == priority.id)

    def get_board(self, board_id: int) -> Board | None:
        return self.db.get(Board, board_id)

    def get_board_column(self, board_column_id: int) -> BoardColumn | None:
        return self.db.get(BoardColumn, board_column_id)
