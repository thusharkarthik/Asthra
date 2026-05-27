from app.schemas.schemas import MetricDefinitionCreate, MetricSnapshotCreate
from app.services.metric_service import MetricDefinitionService, MetricSnapshotService


def test_create_list_get_update_metric_definition(db):
    service = MetricDefinitionService(db)
    metric = service.create(MetricDefinitionCreate(workspace_id=1, metric_key="sla.breach_rate", name="SLA breach rate").model_dump())
    assert len(service.list(workspace_id=1, metric_key="sla.breach_rate")) == 1
    assert service.get(metric.id).name == "SLA breach rate"
    assert service.update(metric.id, {"unit": "percent"}).unit == "percent"


def test_create_list_metric_snapshot(db):
    service = MetricSnapshotService(db)
    snap = service.create(MetricSnapshotCreate(workspace_id=1, metric_key="sla.breach_rate", value=2.5, entity_type="workspace", entity_id=1).model_dump(exclude_none=True))
    assert snap.value == 2.5
    assert len(service.list(workspace_id=1, metric_key="sla.breach_rate", entity_type="workspace", entity_id=1)) == 1
