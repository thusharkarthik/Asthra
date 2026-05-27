from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.action_repository import ActionRepository
from app.repositories.condition_repository import ConditionRepository
from app.repositories.execution_repository import ExecutionRepository
from app.services.audit_log_service import AuditLogService
from app.services.workflow_service import WorkflowService


class WorkflowExecutor:
    def __init__(self, db: Session):
        self.db = db
        self.workflow_service = WorkflowService(db)
        self.conditions = ConditionRepository(db)
        self.actions = ActionRepository(db)
        self.executions = ExecutionRepository(db)
        self.audit = AuditLogService(db)

    def execute(self, workflow_id: int):
        workflow = self.workflow_service.get(workflow_id)
        execution = self.executions.create({"workflow_id": workflow.id, "execution_status": "running"})
        self.audit.log("workflow_execution_started", "running", workflow_id=workflow.id, execution_id=execution.id)

        try:
            log_lines = [
                f"Workflow '{workflow.name}' execution started.",
                "Placeholder condition evaluation completed.",
            ]
            # TODO: AI condition suggestions and autonomous execution belong to future tiers.
            for condition in self.conditions.list_by_workflow(workflow.id):
                log_lines.append(f"Condition {condition.condition_type} evaluated as true.")

            # TODO: Replace placeholder actions with real service integrations in later tiers.
            for action in self.actions.list_by_workflow(workflow.id):
                log_lines.append(f"Action {action.action_type} executed as placeholder.")

            execution.execution_status = "success"
            execution.completed_at = datetime.utcnow()
            execution.execution_log = "\n".join(log_lines)
            self.db.commit()
            self.db.refresh(execution)
            self.audit.log("workflow_execution_completed", "success", workflow_id=workflow.id, execution_id=execution.id)
            return execution
        except Exception:
            execution.execution_status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.execution_log = "Workflow execution failed."
            self.db.commit()
            self.db.refresh(execution)
            self.audit.log("workflow_execution_failed", "failed", workflow_id=workflow.id, execution_id=execution.id)
            return execution
