import pytest
from fastapi import HTTPException

from app.schemas.schemas import APIConnectionCreate
from app.services.api_connection_service import APIConnectionService


def test_create_list_get_update_delete_api_connection(db):
    service = APIConnectionService(db)
    connection = service.create(
        APIConnectionCreate(
            workspace_id=1,
            provider="github",
            base_url="https://api.github.com",
            auth_type="token",
            connection_status="disconnected",
        ).model_dump()
    )

    assert len(service.list(workspace_id=1, provider="github")) == 1
    assert service.get(connection.id).auth_type == "token"
    assert service.update(connection.id, {"connection_status": "connected"}).connection_status == "connected"
    service.delete(connection.id)
    with pytest.raises(HTTPException):
        service.get(connection.id)
