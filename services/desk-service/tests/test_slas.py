from app.schemas.sla import SLACreate
from app.services.sla_service import SLAService


def test_create_and_list_sla(db):
    sla = SLAService(db).create(SLACreate(workspace_id=1, name="High SLA", priority="high", response_time_minutes=30, resolution_time_minutes=240))
    slas = SLAService(db).list(workspace_id=1)
    assert [item.id for item in slas] == [sla.id]
