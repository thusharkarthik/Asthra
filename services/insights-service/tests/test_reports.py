import pytest
from fastapi import HTTPException

from app.schemas.schemas import ReportCreate, ReportRunCreate
from app.services.report_service import ReportRunService, ReportService
from tests.conftest import create_report


def test_create_list_get_update_delete_report(db):
    service = ReportService(db)
    report = service.create(ReportCreate(workspace_id=1, name="Weekly ops", report_type="operations").model_dump())
    assert len(service.list(workspace_id=1, report_type="operations")) == 1
    assert service.get(report.id).name == "Weekly ops"
    assert service.update(report.id, {"status": "active"}).status == "active"
    service.delete(report.id)
    with pytest.raises(HTTPException):
        service.get(report.id)


def test_create_list_get_report_run(db):
    report = create_report(db)
    service = ReportRunService(db)
    run = service.create(report.id, ReportRunCreate(status="pending").model_dump())
    assert len(service.list(report.id)) == 1
    assert service.get(run.id).report_id == report.id
