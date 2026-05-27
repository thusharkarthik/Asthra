import pytest
from fastapi import HTTPException

from app.schemas.schemas import WorkflowCreate
from app.services.workflow_service import WorkflowService


def test_create_list_get_update_delete_workflow(db):
    service = WorkflowService(db)
    workflow = service.create(
        WorkflowCreate(
            workspace_id=1,
            name="Route support tickets",
            description="Route new tickets to the support queue.",
            status="draft",
            created_by_id=1,
        ).model_dump()
    )

    assert len(service.list(workspace_id=1)) == 1
    assert service.get(workflow.id).name == "Route support tickets"

    updated = service.update(workflow.id, {"status": "active"})
    assert updated.status == "active"

    service.delete(workflow.id)
    with pytest.raises(HTTPException) as exc:
        service.get(workflow.id)
    assert exc.value.status_code == 404
