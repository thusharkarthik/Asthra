from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.executors.workflow_executor import WorkflowExecutor
from app.schemas.schemas import (
    ActionCreate,
    ActionRead,
    ActionUpdate,
    AuditLogRead,
    ConditionCreate,
    ConditionRead,
    ConditionUpdate,
    ExecutionRead,
    ScheduleCreate,
    ScheduleRead,
    ScheduleUpdate,
    TriggerCreate,
    TriggerRead,
    TriggerUpdate,
    WorkflowCreate,
    WorkflowRead,
    WorkflowUpdate,
)
from app.services.action_service import ActionService
from app.services.audit_log_service import AuditLogService
from app.services.condition_service import ConditionService
from app.services.execution_service import ExecutionService
from app.services.schedule_service import ScheduleService
from app.services.trigger_service import TriggerService
from app.services.workflow_service import WorkflowService

api_router = APIRouter()


@api_router.post("/workflows", status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db)):
    item = WorkflowService(db).create(payload.model_dump())
    return success_response(data=WorkflowRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/workflows")
def list_workflows(
    workspace_id: int | None = None,
    status: str | None = None,
    created_by_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = WorkflowService(db).list(workspace_id, status, created_by_id, limit, offset)
    return success_response(data=[WorkflowRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.get("/workflows/{workflow_id}")
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    item = WorkflowService(db).get(workflow_id)
    return success_response(data=WorkflowRead.model_validate(item).model_dump(mode="json"))


@api_router.patch("/workflows/{workflow_id}")
def update_workflow(workflow_id: int, payload: WorkflowUpdate, db: Session = Depends(get_db)):
    item = WorkflowService(db).update(workflow_id, payload.model_dump(exclude_unset=True))
    return success_response(data=WorkflowRead.model_validate(item).model_dump(mode="json"))


@api_router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    WorkflowService(db).delete(workflow_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/workflows/{workflow_id}/triggers", status_code=status.HTTP_201_CREATED)
def create_trigger(workflow_id: int, payload: TriggerCreate, db: Session = Depends(get_db)):
    item = TriggerService(db).create(workflow_id, payload.model_dump())
    return success_response(data=TriggerRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/workflows/{workflow_id}/triggers")
def list_triggers(workflow_id: int, db: Session = Depends(get_db)):
    items = TriggerService(db).list(workflow_id)
    return success_response(data=[TriggerRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.patch("/triggers/{trigger_id}")
def update_trigger(trigger_id: int, payload: TriggerUpdate, db: Session = Depends(get_db)):
    item = TriggerService(db).update(trigger_id, payload.model_dump(exclude_unset=True))
    return success_response(data=TriggerRead.model_validate(item).model_dump(mode="json"))


@api_router.delete("/triggers/{trigger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trigger(trigger_id: int, db: Session = Depends(get_db)):
    TriggerService(db).delete(trigger_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/workflows/{workflow_id}/conditions", status_code=status.HTTP_201_CREATED)
def create_condition(workflow_id: int, payload: ConditionCreate, db: Session = Depends(get_db)):
    item = ConditionService(db).create(workflow_id, payload.model_dump())
    return success_response(data=ConditionRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/workflows/{workflow_id}/conditions")
def list_conditions(workflow_id: int, db: Session = Depends(get_db)):
    items = ConditionService(db).list(workflow_id)
    return success_response(data=[ConditionRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.patch("/conditions/{condition_id}")
def update_condition(condition_id: int, payload: ConditionUpdate, db: Session = Depends(get_db)):
    item = ConditionService(db).update(condition_id, payload.model_dump(exclude_unset=True))
    return success_response(data=ConditionRead.model_validate(item).model_dump(mode="json"))


@api_router.delete("/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_condition(condition_id: int, db: Session = Depends(get_db)):
    ConditionService(db).delete(condition_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/workflows/{workflow_id}/actions", status_code=status.HTTP_201_CREATED)
def create_action(workflow_id: int, payload: ActionCreate, db: Session = Depends(get_db)):
    item = ActionService(db).create(workflow_id, payload.model_dump())
    return success_response(data=ActionRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/workflows/{workflow_id}/actions")
def list_actions(workflow_id: int, db: Session = Depends(get_db)):
    items = ActionService(db).list(workflow_id)
    return success_response(data=[ActionRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.patch("/actions/{action_id}")
def update_action(action_id: int, payload: ActionUpdate, db: Session = Depends(get_db)):
    item = ActionService(db).update(action_id, payload.model_dump(exclude_unset=True))
    return success_response(data=ActionRead.model_validate(item).model_dump(mode="json"))


@api_router.delete("/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action(action_id: int, db: Session = Depends(get_db)):
    ActionService(db).delete(action_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/workflows/{workflow_id}/execute", status_code=status.HTTP_201_CREATED)
def execute_workflow(workflow_id: int, db: Session = Depends(get_db)):
    item = WorkflowExecutor(db).execute(workflow_id)
    return success_response(data=ExecutionRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/executions")
def list_executions(
    workflow_id: int | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = ExecutionService(db).list(workflow_id, status, limit, offset)
    return success_response(data=[ExecutionRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.get("/executions/{execution_id}")
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    item = ExecutionService(db).get(execution_id)
    return success_response(data=ExecutionRead.model_validate(item).model_dump(mode="json"))


@api_router.post("/workflows/{workflow_id}/schedule", status_code=status.HTTP_201_CREATED)
def create_schedule(workflow_id: int, payload: ScheduleCreate, db: Session = Depends(get_db)):
    item = ScheduleService(db).create(workflow_id, payload.model_dump())
    return success_response(data=ScheduleRead.model_validate(item).model_dump(mode="json"))


@api_router.get("/schedules")
def list_schedules(
    workflow_id: int | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = ScheduleService(db).list(workflow_id, is_active, limit, offset)
    return success_response(data=[ScheduleRead.model_validate(item).model_dump(mode="json") for item in items])


@api_router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id: int, payload: ScheduleUpdate, db: Session = Depends(get_db)):
    item = ScheduleService(db).update(schedule_id, payload.model_dump(exclude_unset=True))
    return success_response(data=ScheduleRead.model_validate(item).model_dump(mode="json"))


@api_router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    ScheduleService(db).delete(schedule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.get("/audit-logs")
def list_audit_logs(
    workflow_id: int | None = None,
    execution_id: int | None = None,
    action: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    items = AuditLogService(db).list(workflow_id, execution_id, action, status, limit, offset)
    return success_response(data=[AuditLogRead.model_validate(item).model_dump(mode="json", by_alias=True) for item in items])
