import pytest
from fastapi import HTTPException

from app.schemas.schemas import DashboardWidgetCreate
from app.services.dashboard_service import DashboardWidgetService
from tests.conftest import create_dashboard


def test_create_list_update_delete_widget(db):
    dashboard = create_dashboard(db)
    service = DashboardWidgetService(db)
    widget = service.create(dashboard.id, DashboardWidgetCreate(widget_type="kpi", title="Open work").model_dump())
    assert len(service.list(dashboard.id)) == 1
    assert service.update(widget.id, {"title": "Open work items"}).title == "Open work items"
    service.delete(widget.id)
    with pytest.raises(HTTPException):
        service.get(widget.id)
