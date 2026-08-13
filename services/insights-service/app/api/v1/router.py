from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas.schemas import (
    DashboardCreate, DashboardRead, DashboardUpdate, DashboardWidgetCreate, DashboardWidgetRead, DashboardWidgetUpdate,
    InsightEventCreate, InsightEventRead, MetricDefinitionCreate, MetricDefinitionRead, MetricDefinitionUpdate,
    MetricSnapshotCreate, MetricSnapshotRead, ReportCreate, ReportRead, ReportRunCreate, ReportRunRead, ReportUpdate,
    UsageMetricCreate, UsageMetricRead,
)
from app.services.dashboard_service import DashboardService, DashboardWidgetService
from app.services.insight_event_service import InsightEventService
from app.services.metric_service import MetricDefinitionService, MetricSnapshotService
from app.services.report_service import ReportRunService, ReportService
from app.services.usage_metric_service import UsageMetricService

api_router = APIRouter()


def _dump(schema, item, by_alias: bool = False):
    return schema.model_validate(item).model_dump(mode="json", by_alias=by_alias)


@api_router.post("/dashboards", status_code=status.HTTP_201_CREATED)
def create_dashboard(payload: DashboardCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(DashboardRead, DashboardService(db).create(payload.model_dump())))


@api_router.get("/dashboards")
def list_dashboards(workspace_id: int | None = None, created_by_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(DashboardRead, i) for i in DashboardService(db).list(workspace_id, created_by_id, limit, offset)])


@api_router.get("/dashboards/{dashboard_id}")
def get_dashboard(dashboard_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(DashboardRead, DashboardService(db).get(dashboard_id)))


@api_router.patch("/dashboards/{dashboard_id}")
def update_dashboard(dashboard_id: int, payload: DashboardUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(DashboardRead, DashboardService(db).update(dashboard_id, payload.model_dump(exclude_unset=True))))


@api_router.delete("/dashboards/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dashboard(dashboard_id: int, db: Session = Depends(get_db)):
    DashboardService(db).delete(dashboard_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/dashboards/{dashboard_id}/widgets", status_code=status.HTTP_201_CREATED)
def create_widget(dashboard_id: int, payload: DashboardWidgetCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(DashboardWidgetRead, DashboardWidgetService(db).create(dashboard_id, payload.model_dump())))


@api_router.get("/dashboards/{dashboard_id}/widgets")
def list_widgets(dashboard_id: int, db: Session = Depends(get_db)):
    return success_response(data=[_dump(DashboardWidgetRead, i) for i in DashboardWidgetService(db).list(dashboard_id)])


@api_router.patch("/widgets/{widget_id}")
def update_widget(widget_id: int, payload: DashboardWidgetUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(DashboardWidgetRead, DashboardWidgetService(db).update(widget_id, payload.model_dump(exclude_unset=True))))


@api_router.delete("/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    DashboardWidgetService(db).delete(widget_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/metrics/definitions", status_code=status.HTTP_201_CREATED)
def create_metric_definition(payload: MetricDefinitionCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(MetricDefinitionRead, MetricDefinitionService(db).create(payload.model_dump())))


@api_router.get("/metrics/definitions")
def list_metric_definitions(workspace_id: int | None = None, metric_key: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(MetricDefinitionRead, i) for i in MetricDefinitionService(db).list(workspace_id, metric_key, limit, offset)])


@api_router.get("/metrics/definitions/{metric_definition_id}")
def get_metric_definition(metric_definition_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(MetricDefinitionRead, MetricDefinitionService(db).get(metric_definition_id)))


@api_router.patch("/metrics/definitions/{metric_definition_id}")
def update_metric_definition(metric_definition_id: int, payload: MetricDefinitionUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(MetricDefinitionRead, MetricDefinitionService(db).update(metric_definition_id, payload.model_dump(exclude_unset=True))))


@api_router.post("/metrics/snapshots", status_code=status.HTTP_201_CREATED)
def create_metric_snapshot(payload: MetricSnapshotCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_none=True)
    return success_response(data=_dump(MetricSnapshotRead, MetricSnapshotService(db).create(data)))


@api_router.get("/metrics/snapshots")
def list_metric_snapshots(workspace_id: int | None = None, metric_key: str | None = None, entity_type: str | None = None, entity_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(MetricSnapshotRead, i) for i in MetricSnapshotService(db).list(workspace_id, metric_key, entity_type, entity_id, limit, offset)])


@api_router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ReportRead, ReportService(db).create(payload.model_dump())))


@api_router.get("/reports")
def list_reports(workspace_id: int | None = None, report_type: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(ReportRead, i) for i in ReportService(db).list(workspace_id, report_type, status, limit, offset)])


@api_router.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(ReportRead, ReportService(db).get(report_id)))


@api_router.patch("/reports/{report_id}")
def update_report(report_id: int, payload: ReportUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ReportRead, ReportService(db).update(report_id, payload.model_dump(exclude_unset=True))))


@api_router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    ReportService(db).delete(report_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/reports/{report_id}/runs", status_code=status.HTTP_201_CREATED)
def create_report_run(report_id: int, payload: ReportRunCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ReportRunRead, ReportRunService(db).create(report_id, payload.model_dump())))


@api_router.get("/reports/{report_id}/runs")
def list_report_runs(report_id: int, db: Session = Depends(get_db)):
    return success_response(data=[_dump(ReportRunRead, i) for i in ReportRunService(db).list(report_id)])


@api_router.get("/report-runs/{run_id}")
def get_report_run(run_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(ReportRunRead, ReportRunService(db).get(run_id)))


@api_router.post("/insight-events", status_code=status.HTTP_201_CREATED)
def create_insight_event(payload: InsightEventCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(InsightEventRead, InsightEventService(db).create(payload.model_dump(by_alias=False)), by_alias=True))


@api_router.get("/insight-events")
def list_insight_events(workspace_id: int | None = None, severity: str | None = None, event_type: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(InsightEventRead, i, by_alias=True) for i in InsightEventService(db).list(workspace_id, severity, event_type, limit, offset)])


@api_router.post("/usage-metrics", status_code=status.HTTP_201_CREATED)
def create_usage_metric(payload: UsageMetricCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(UsageMetricRead, UsageMetricService(db).create(payload.model_dump(exclude_none=True))))


@api_router.get("/usage-metrics")
def list_usage_metrics(workspace_id: int | None = None, service_name: str | None = None, metric_name: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return success_response(data=[_dump(UsageMetricRead, i) for i in UsageMetricService(db).list(workspace_id, service_name, metric_name, limit, offset)])
