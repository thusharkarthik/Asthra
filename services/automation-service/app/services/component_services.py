from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.action_repository import ActionRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.condition_repository import ConditionRepository
from app.repositories.execution_repository import ExecutionRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.trigger_repository import TriggerRepository
from app.services.workflow_service import WorkflowService


class AuditLogService:
    def __init__(self, db: Session):
        self.repository = AuditLogRepository(db)

    def log(self, action: str, status_value: str, workflow_id: int | None = None, execution_id: int | None = None, metadata: dict | None = None):
        return self.repository.create(
            {
                "workflow_id": workflow_id,
                "execution_id": execution_id,
                "action": action,
                "status": status_value,
                "metadata_json": metadata,
            }
        )

    def list(self, workflow_id=None, execution_id=None, action=None, status=None, limit=100, offset=0):
        return self.repository.list(workflow_id, execution_id, action, status, limit, offset)


class TriggerService:
    def __init__(self, db: Session):
        self.repository = TriggerRepository(db)
        self.workflow_service = WorkflowService(db)
        self.audit = AuditLogService(db)

    def create(self, workflow_id: int, data: dict):
        self.workflow_service.get(workflow_id)
        item = self.repository.create({"workflow_id": workflow_id, **data})
        self.audit.log("trigger_created", "success", workflow_id=workflow_id, metadata={"trigger_type": item.trigger_type})
        return item

    def list(self, workflow_id: int):
        self.workflow_service.get(workflow_id)
        return self.repository.list_by_workflow(workflow_id)

    def get(self, trigger_id: int):
        item = self.repository.get(trigger_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trigger not found.")
        return item

    def update(self, trigger_id: int, data: dict):
        return self.repository.update(self.get(trigger_id), data)

    def delete(self, trigger_id: int) -> None:
        self.repository.delete(self.get(trigger_id))


class ConditionService:
    def __init__(self, db: Session):
        self.repository = ConditionRepository(db)
        self.workflow_service = WorkflowService(db)
        self.audit = AuditLogService(db)

    def create(self, workflow_id: int, data: dict):
        self.workflow_service.get(workflow_id)
        item = self.repository.create({"workflow_id": workflow_id, **data})
        self.audit.log("condition_created", "success", workflow_id=workflow_id, metadata={"condition_type": item.condition_type})
        return item

    def list(self, workflow_id: int):
        self.workflow_service.get(workflow_id)
        return self.repository.list_by_workflow(workflow_id)

    def get(self, condition_id: int):
        item = self.repository.get(condition_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Condition not found.")
        return item

    def update(self, condition_id: int, data: dict):
        return self.repository.update(self.get(condition_id), data)

    def delete(self, condition_id: int) -> None:
        self.repository.delete(self.get(condition_id))


class ActionService:
    def __init__(self, db: Session):
        self.repository = ActionRepository(db)
        self.workflow_service = WorkflowService(db)
        self.audit = AuditLogService(db)

    def create(self, workflow_id: int, data: dict):
        self.workflow_service.get(workflow_id)
        self._validate_order(data.get("execution_order", 1))
        item = self.repository.create({"workflow_id": workflow_id, **data})
        self.audit.log("action_created", "success", workflow_id=workflow_id, metadata={"action_type": item.action_type})
        return item

    def list(self, workflow_id: int):
        self.workflow_service.get(workflow_id)
        return self.repository.list_by_workflow(workflow_id)

    def get(self, action_id: int):
        item = self.repository.get(action_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found.")
        return item

    def update(self, action_id: int, data: dict):
        if "execution_order" in data:
            self._validate_order(data["execution_order"])
        return self.repository.update(self.get(action_id), data)

    def delete(self, action_id: int) -> None:
        self.repository.delete(self.get(action_id))

    @staticmethod
    def _validate_order(value: int) -> None:
        if value < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="execution_order must be positive")


class ExecutionService:
    def __init__(self, db: Session):
        self.repository = ExecutionRepository(db)

    def list(self, workflow_id=None, status=None, limit=100, offset=0):
        return self.repository.list(workflow_id, status, limit, offset)

    def get(self, execution_id: int):
        item = self.repository.get(execution_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found.")
        return item


class ScheduleService:
    def __init__(self, db: Session):
        self.repository = ScheduleRepository(db)
        self.workflow_service = WorkflowService(db)
        self.audit = AuditLogService(db)

    def create(self, workflow_id: int, data: dict):
        self.workflow_service.get(workflow_id)
        item = self.repository.create({"workflow_id": workflow_id, **data})
        self.audit.log("schedule_created", "success", workflow_id=workflow_id)
        return item

    def list(self, workflow_id=None, is_active=None, limit=100, offset=0):
        return self.repository.list(workflow_id, is_active, limit, offset)

    def get(self, schedule_id: int):
        item = self.repository.get(schedule_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
        return item

    def update(self, schedule_id: int, data: dict):
        return self.repository.update(self.get(schedule_id), data)

    def delete(self, schedule_id: int) -> None:
        self.repository.delete(self.get(schedule_id))
