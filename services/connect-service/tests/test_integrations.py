import pytest
from fastapi import HTTPException

from app.schemas.schemas import IntegrationCreate
from app.services.integration_service import IntegrationService


def test_create_list_get_update_delete_integration(db):
    service = IntegrationService(db)
    integration = service.create(
        IntegrationCreate(workspace_id=1, name="Slack", provider="slack", status="inactive").model_dump()
    )

    assert len(service.list(workspace_id=1, provider="slack")) == 1
    assert service.get(integration.id).name == "Slack"
    assert service.update(integration.id, {"status": "active"}).status == "active"
    service.delete(integration.id)
    with pytest.raises(HTTPException):
        service.get(integration.id)
