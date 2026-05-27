import pytest
from fastapi import HTTPException

from app.schemas.schemas import ConnectorCreate
from app.services.connector_service import ConnectorService
from tests.conftest import create_integration


def test_create_list_get_update_delete_connector(db):
    integration = create_integration(db)
    service = ConnectorService(db)
    connector = service.create(
        ConnectorCreate(
            integration_id=integration.id,
            connector_type="github",
            connector_name="GitHub Issues",
            status="inactive",
        ).model_dump()
    )

    assert len(service.list(integration_id=integration.id)) == 1
    assert service.get(connector.id).connector_name == "GitHub Issues"
    assert service.update(connector.id, {"status": "active"}).status == "active"
    service.delete(connector.id)
    with pytest.raises(HTTPException):
        service.get(connector.id)
