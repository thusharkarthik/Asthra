from app.executors.workflow_executor import WorkflowExecutor
from app.schemas.schemas import ActionCreate, ScheduleCreate
from app.services.action_service import ActionService
from app.services.audit_log_service import AuditLogService
from app.services.execution_service import ExecutionService
from app.services.schedule_service import ScheduleService
from tests.conftest import create_workflow


def test_execute_workflow_and_list_execution(db):
    workflow = create_workflow(db)
    ActionService(db).create(
        workflow.id,
        ActionCreate(action_type="update_status_placeholder", execution_order=1).model_dump(),
    )

    execution = WorkflowExecutor(db).execute(workflow.id)
    assert execution.execution_status == "success"
    assert "placeholder" in execution.execution_log

    execution_service = ExecutionService(db)
    assert len(execution_service.list(workflow_id=workflow.id)) == 1
    assert execution_service.get(execution.id).id == execution.id


def test_create_list_update_delete_schedule(db):
    workflow = create_workflow(db)
    service = ScheduleService(db)
    schedule = service.create(
        workflow.id,
        ScheduleCreate(interval_seconds=3600, is_active=True).model_dump(),
    )

    assert len(service.list(workflow_id=workflow.id)) == 1
    assert service.update(schedule.id, {"is_active": False}).is_active is False
    service.delete(schedule.id)
    assert len(service.list(workflow_id=workflow.id)) == 0


def test_list_audit_logs(db):
    workflow = create_workflow(db)
    ActionService(db).create(workflow.id, ActionCreate(action_type="create_notification").model_dump())

    logs = AuditLogService(db).list(workflow_id=workflow.id)
    assert len(logs) >= 1
