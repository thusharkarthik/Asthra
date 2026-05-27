import pytest
from fastapi import HTTPException

from app.schemas.schemas import ActionCreate, ConditionCreate, TriggerCreate
from app.services.action_service import ActionService
from app.services.condition_service import ConditionService
from app.services.trigger_service import TriggerService
from tests.conftest import create_workflow


def test_create_list_update_delete_trigger(db):
    workflow = create_workflow(db)
    service = TriggerService(db)
    trigger = service.create(
        workflow.id,
        TriggerCreate(trigger_type="manual", trigger_config={"source": "test"}).model_dump(),
    )

    assert len(service.list(workflow.id)) == 1
    assert service.update(trigger.id, {"is_active": False}).is_active is False
    service.delete(trigger.id)
    with pytest.raises(HTTPException):
        service.get(trigger.id)


def test_create_list_update_delete_condition(db):
    workflow = create_workflow(db)
    service = ConditionService(db)
    condition = service.create(
        workflow.id,
        ConditionCreate(
            condition_type="field_equals",
            condition_config={"field": "priority", "value": "high"},
        ).model_dump(),
    )

    assert len(service.list(workflow.id)) == 1
    assert service.update(condition.id, {"condition_type": "always"}).condition_type == "always"
    service.delete(condition.id)
    with pytest.raises(HTTPException):
        service.get(condition.id)


def test_create_list_update_delete_action(db):
    workflow = create_workflow(db)
    service = ActionService(db)
    action = service.create(
        workflow.id,
        ActionCreate(
            action_type="create_notification",
            action_config={"title": "New item"},
            execution_order=1,
        ).model_dump(),
    )

    assert len(service.list(workflow.id)) == 1
    assert service.update(action.id, {"execution_order": 2}).execution_order == 2
    service.delete(action.id)
    with pytest.raises(HTTPException):
        service.get(action.id)
