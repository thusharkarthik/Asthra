from app.schemas.schemas import InsightEventCreate, UsageMetricCreate
from app.services.insight_event_service import InsightEventService
from app.services.usage_metric_service import UsageMetricService


def test_create_list_insight_event(db):
    service = InsightEventService(db)
    event = service.create(InsightEventCreate(workspace_id=1, event_type="project_health", severity="info", title="Healthy").model_dump(by_alias=False))
    assert event.title == "Healthy"
    assert len(service.list(workspace_id=1, severity="info", event_type="project_health")) == 1


def test_create_list_usage_metric(db):
    service = UsageMetricService(db)
    metric = service.create(UsageMetricCreate(workspace_id=1, service_name="flow-service", metric_name="requests", value=100).model_dump(exclude_none=True))
    assert metric.value == 100
    assert len(service.list(workspace_id=1, service_name="flow-service", metric_name="requests")) == 1
