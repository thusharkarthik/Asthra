from sqlalchemy.orm import Session

from app.models import Dashboard, DashboardWidget, InsightEvent, MetricDefinition, MetricSnapshot, Report, ReportRun, UsageMetric


class BaseRepository:
    model: type

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        item = self.model(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data: dict):
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item) -> None:
        self.db.delete(item)
        self.db.commit()


class DashboardRepository(BaseRepository):
    model = Dashboard

    def list(self, workspace_id=None, created_by_id=None, limit=100, offset=0):
        query = self.db.query(Dashboard)
        if workspace_id is not None:
            query = query.filter(Dashboard.workspace_id == workspace_id)
        if created_by_id is not None:
            query = query.filter(Dashboard.created_by_id == created_by_id)
        return query.order_by(Dashboard.id.desc()).offset(offset).limit(limit).all()


class DashboardWidgetRepository(BaseRepository):
    model = DashboardWidget

    def list_by_dashboard(self, dashboard_id: int):
        return self.db.query(DashboardWidget).filter(DashboardWidget.dashboard_id == dashboard_id).order_by(DashboardWidget.id.asc()).all()


class MetricDefinitionRepository(BaseRepository):
    model = MetricDefinition

    def list(self, workspace_id=None, metric_key=None, limit=100, offset=0):
        query = self.db.query(MetricDefinition)
        if workspace_id is not None:
            query = query.filter(MetricDefinition.workspace_id == workspace_id)
        if metric_key is not None:
            query = query.filter(MetricDefinition.metric_key == metric_key)
        return query.order_by(MetricDefinition.id.desc()).offset(offset).limit(limit).all()


class MetricSnapshotRepository(BaseRepository):
    model = MetricSnapshot

    def list(self, workspace_id=None, metric_key=None, entity_type=None, entity_id=None, limit=100, offset=0):
        query = self.db.query(MetricSnapshot)
        if workspace_id is not None:
            query = query.filter(MetricSnapshot.workspace_id == workspace_id)
        if metric_key is not None:
            query = query.filter(MetricSnapshot.metric_key == metric_key)
        if entity_type is not None:
            query = query.filter(MetricSnapshot.entity_type == entity_type)
        if entity_id is not None:
            query = query.filter(MetricSnapshot.entity_id == entity_id)
        return query.order_by(MetricSnapshot.id.desc()).offset(offset).limit(limit).all()


class ReportRepository(BaseRepository):
    model = Report

    def list(self, workspace_id=None, report_type=None, status=None, limit=100, offset=0):
        query = self.db.query(Report)
        if workspace_id is not None:
            query = query.filter(Report.workspace_id == workspace_id)
        if report_type is not None:
            query = query.filter(Report.report_type == report_type)
        if status is not None:
            query = query.filter(Report.status == status)
        return query.order_by(Report.id.desc()).offset(offset).limit(limit).all()


class ReportRunRepository(BaseRepository):
    model = ReportRun

    def list_by_report(self, report_id: int):
        return self.db.query(ReportRun).filter(ReportRun.report_id == report_id).order_by(ReportRun.id.desc()).all()


class InsightEventRepository(BaseRepository):
    model = InsightEvent

    def list(self, workspace_id=None, severity=None, event_type=None, limit=100, offset=0):
        query = self.db.query(InsightEvent)
        if workspace_id is not None:
            query = query.filter(InsightEvent.workspace_id == workspace_id)
        if severity is not None:
            query = query.filter(InsightEvent.severity == severity)
        if event_type is not None:
            query = query.filter(InsightEvent.event_type == event_type)
        return query.order_by(InsightEvent.id.desc()).offset(offset).limit(limit).all()


class UsageMetricRepository(BaseRepository):
    model = UsageMetric

    def list(self, workspace_id=None, service_name=None, metric_name=None, limit=100, offset=0):
        query = self.db.query(UsageMetric)
        if workspace_id is not None:
            query = query.filter(UsageMetric.workspace_id == workspace_id)
        if service_name is not None:
            query = query.filter(UsageMetric.service_name == service_name)
        if metric_name is not None:
            query = query.filter(UsageMetric.metric_name == metric_name)
        return query.order_by(UsageMetric.id.desc()).offset(offset).limit(limit).all()
