from typing import TypeVar

from sqlalchemy.orm import Session

from app.models import (
    AutomationAuditLog,
    ScheduledJob,
    WorkflowAction,
    WorkflowCondition,
    WorkflowExecution,
    WorkflowTrigger,
)

ModelT = TypeVar("ModelT")


class BaseRepository:
    model: type

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        item = self.model(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data: dict):
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item) -> None:
        self.db.delete(item)
        self.db.commit()


class TriggerRepository(BaseRepository):
    model = WorkflowTrigger

    def list_by_workflow(self, workflow_id: int) -> list[WorkflowTrigger]:
        return (
            self.db.query(WorkflowTrigger)
            .filter(WorkflowTrigger.workflow_id == workflow_id)
            .order_by(WorkflowTrigger.id.asc())
            .all()
        )


class ConditionRepository(BaseRepository):
    model = WorkflowCondition

    def list_by_workflow(self, workflow_id: int) -> list[WorkflowCondition]:
        return (
            self.db.query(WorkflowCondition)
            .filter(WorkflowCondition.workflow_id == workflow_id)
            .order_by(WorkflowCondition.id.asc())
            .all()
        )


class ActionRepository(BaseRepository):
    model = WorkflowAction

    def list_by_workflow(self, workflow_id: int) -> list[WorkflowAction]:
        return (
            self.db.query(WorkflowAction)
            .filter(WorkflowAction.workflow_id == workflow_id)
            .order_by(WorkflowAction.execution_order.asc(), WorkflowAction.id.asc())
            .all()
        )


class ExecutionRepository(BaseRepository):
    model = WorkflowExecution

    def list(self, workflow_id: int | None = None, status: str | None = None, limit: int = 100, offset: int = 0):
        query = self.db.query(WorkflowExecution)
        if workflow_id is not None:
            query = query.filter(WorkflowExecution.workflow_id == workflow_id)
        if status is not None:
            query = query.filter(WorkflowExecution.execution_status == status)
        return query.order_by(WorkflowExecution.id.desc()).offset(offset).limit(limit).all()


class ScheduleRepository(BaseRepository):
    model = ScheduledJob

    def list(self, workflow_id: int | None = None, is_active: bool | None = None, limit: int = 100, offset: int = 0):
        query = self.db.query(ScheduledJob)
        if workflow_id is not None:
            query = query.filter(ScheduledJob.workflow_id == workflow_id)
        if is_active is not None:
            query = query.filter(ScheduledJob.is_active == is_active)
        return query.order_by(ScheduledJob.id.desc()).offset(offset).limit(limit).all()


class AuditLogRepository(BaseRepository):
    model = AutomationAuditLog

    def list(
        self,
        workflow_id: int | None = None,
        execution_id: int | None = None,
        action: str | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AutomationAuditLog]:
        query = self.db.query(AutomationAuditLog)
        if workflow_id is not None:
            query = query.filter(AutomationAuditLog.workflow_id == workflow_id)
        if execution_id is not None:
            query = query.filter(AutomationAuditLog.execution_id == execution_id)
        if action is not None:
            query = query.filter(AutomationAuditLog.action == action)
        if status is not None:
            query = query.filter(AutomationAuditLog.status == status)
        return query.order_by(AutomationAuditLog.id.desc()).offset(offset).limit(limit).all()
