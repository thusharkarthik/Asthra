from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.work_item_status import WorkItemStatus
from app.models.workflow import Workflow, WorkflowTransition
from app.schemas.workflow import WorkflowCreate, WorkflowStatusCreate, WorkflowStatusUpdate, WorkflowTransitionCreate, WorkflowUpdate


class WorkflowRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, workflow_create: WorkflowCreate) -> Workflow:
        workflow = Workflow(**workflow_create.model_dump())
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def list(self, project_id: int | None = None, workspace_id: int | None = None) -> list[Workflow]:
        statement = select(Workflow).options(selectinload(Workflow.statuses), selectinload(Workflow.transitions)).order_by(Workflow.id)
        if project_id is not None:
            statement = statement.where(Workflow.project_id == project_id)
        if workspace_id is not None:
            statement = statement.where(Workflow.workspace_id == workspace_id)
        return list(self.db.scalars(statement).all())

    def get(self, workflow_id: int) -> Workflow | None:
        return self.db.scalar(
            select(Workflow)
            .options(selectinload(Workflow.statuses), selectinload(Workflow.transitions))
            .where(Workflow.id == workflow_id)
        )

    def get_for_project(self, project_id: int) -> Workflow | None:
        return self.db.scalar(
            select(Workflow)
            .options(selectinload(Workflow.statuses), selectinload(Workflow.transitions))
            .where(Workflow.project_id == project_id)
            .order_by(Workflow.id)
        )

    def get_default(self) -> Workflow | None:
        return self.db.scalar(
            select(Workflow)
            .options(selectinload(Workflow.statuses), selectinload(Workflow.transitions))
            .where(Workflow.is_default.is_(True), Workflow.project_id.is_(None))
            .order_by(Workflow.id)
        )

    def update(self, workflow: Workflow, workflow_update: WorkflowUpdate) -> Workflow:
        for field, value in workflow_update.model_dump(exclude_unset=True).items():
            setattr(workflow, field, value)
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def delete(self, workflow: Workflow) -> None:
        self.db.delete(workflow)
        self.db.commit()

    def create_status(self, workflow_id: int, status_create: WorkflowStatusCreate) -> WorkItemStatus:
        key = status_create.key or status_create.name
        workflow_status = WorkItemStatus(
            workflow_id=workflow_id,
            name=status_create.name,
            key=normalize_key(key),
            category=status_create.category,
            sort_order=status_create.sort_order,
        )
        self.db.add(workflow_status)
        self.db.commit()
        self.db.refresh(workflow_status)
        return workflow_status

    def update_status(self, workflow_status: WorkItemStatus, status_update: WorkflowStatusUpdate) -> WorkItemStatus:
        update_data = status_update.model_dump(exclude_unset=True)
        if "key" in update_data and update_data["key"] is not None:
            update_data["key"] = normalize_key(update_data["key"])
        for field, value in update_data.items():
            setattr(workflow_status, field, value)
        self.db.add(workflow_status)
        self.db.commit()
        self.db.refresh(workflow_status)
        return workflow_status

    def get_status(self, status_id: int) -> WorkItemStatus | None:
        return self.db.get(WorkItemStatus, status_id)

    def find_status(self, workflow_id: int, key_or_name: str) -> WorkItemStatus | None:
        normalized = normalize_key(key_or_name)
        return self.db.scalar(
            select(WorkItemStatus).where(
                WorkItemStatus.workflow_id == workflow_id,
                WorkItemStatus.is_active.is_(True),
                (WorkItemStatus.key == normalized) | (WorkItemStatus.name == key_or_name),
            )
        )

    def create_transition(self, workflow_id: int, transition_create: WorkflowTransitionCreate) -> WorkflowTransition:
        transition = WorkflowTransition(workflow_id=workflow_id, **transition_create.model_dump())
        self.db.add(transition)
        self.db.commit()
        self.db.refresh(transition)
        return transition

    def list_transitions(self, workflow_id: int) -> list[WorkflowTransition]:
        return list(self.db.scalars(select(WorkflowTransition).where(WorkflowTransition.workflow_id == workflow_id).order_by(WorkflowTransition.id)).all())

    def transition_exists(self, workflow_id: int, from_status_id: int, to_status_id: int) -> bool:
        return self.db.scalar(
            select(WorkflowTransition).where(
                WorkflowTransition.workflow_id == workflow_id,
                WorkflowTransition.from_status_id == from_status_id,
                WorkflowTransition.to_status_id == to_status_id,
            )
        ) is not None


def normalize_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_")
