import pytest
from fastapi import HTTPException

from app.schemas.schemas import DashboardCreate
from app.services.dashboard_service import DashboardService


def test_create_list_get_update_delete_dashboard(db):
    service = DashboardService(db)
    dashboard = service.create(DashboardCreate(workspace_id=1, name="Ops", created_by_id=1).model_dump())
    assert len(service.list(workspace_id=1, created_by_id=1)) == 1
    assert service.get(dashboard.id).name == "Ops"
    assert service.update(dashboard.id, {"name": "Operations"}).name == "Operations"
    service.delete(dashboard.id)
    with pytest.raises(HTTPException):
        service.get(dashboard.id)
