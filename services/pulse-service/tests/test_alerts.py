from app.schemas.alert import AlertUpdate
from app.services.services import AlertService
from .conftest import create_alert


def test_create_list_get_update_alert(db):
    alert = create_alert(db)
    assert AlertService(db).list(workspace_id=1, status="open", severity="high", source="test", limit=10, offset=0)[0].id == alert.id
    assert AlertService(db).get(alert.id).title == "High latency"
    assert AlertService(db).update(alert.id, AlertUpdate(status="acknowledged")).status == "acknowledged"
