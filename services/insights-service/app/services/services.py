from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import DashboardRepository, DashboardWidgetRepository
from app.repositories.insight_event_repository import InsightEventRepository
from app.repositories.metric_repository import MetricDefinitionRepository, MetricSnapshotRepository
from app.repositories.report_repository import ReportRepository, ReportRunRepository
from app.repositories.usage_metric_repository import UsageMetricRepository


class BaseService:
    not_found_message = "Record not found."

    def _get_or_404(self, repo, item_id: int):
        item = repo.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.not_found_message)
        return item

    @staticmethod
    def _required(value, message: str) -> None:
        if value is None or value == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class DashboardService(BaseService):
    not_found_message = "Dashboard not found."

    def __init__(self, db: Session):
        self.repository = DashboardRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("name"), "dashboard name is required"); return self.repository.create(data)
    def list(self, workspace_id=None, created_by_id=None, limit=100, offset=0): return self.repository.list(workspace_id, created_by_id, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)
    def delete(self, item_id): self.repository.delete(self.get(item_id))


class DashboardWidgetService(BaseService):
    not_found_message = "Dashboard widget not found."

    def __init__(self, db: Session):
        self.repository = DashboardWidgetRepository(db)
        self.dashboard_service = DashboardService(db)

    def create(self, dashboard_id, data):
        self.dashboard_service.get(dashboard_id)
        self._required(data.get("widget_type"), "widget type is required")
        return self.repository.create({"dashboard_id": dashboard_id, **data})

    def list(self, dashboard_id): self.dashboard_service.get(dashboard_id); return self.repository.list_by_dashboard(dashboard_id)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)
    def delete(self, item_id): self.repository.delete(self.get(item_id))


class MetricDefinitionService(BaseService):
    not_found_message = "Metric definition not found."

    def __init__(self, db: Session):
        self.repository = MetricDefinitionRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("metric_key"), "metric key is required"); return self.repository.create(data)
    def list(self, workspace_id=None, metric_key=None, limit=100, offset=0): return self.repository.list(workspace_id, metric_key, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)


class MetricSnapshotService(BaseService):
    def __init__(self, db: Session):
        self.repository = MetricSnapshotRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("metric_key"), "metric key is required"); return self.repository.create(data)
    def list(self, workspace_id=None, metric_key=None, entity_type=None, entity_id=None, limit=100, offset=0): return self.repository.list(workspace_id, metric_key, entity_type, entity_id, limit, offset)


class ReportService(BaseService):
    not_found_message = "Report not found."

    def __init__(self, db: Session):
        self.repository = ReportRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("name"), "report name is required"); return self.repository.create(data)
    def list(self, workspace_id=None, report_type=None, status=None, limit=100, offset=0): return self.repository.list(workspace_id, report_type, status, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)
    def delete(self, item_id): self.repository.delete(self.get(item_id))


class ReportRunService(BaseService):
    not_found_message = "Report run not found."

    def __init__(self, db: Session):
        self.repository = ReportRunRepository(db)
        self.report_service = ReportService(db)

    def create(self, report_id, data): self.report_service.get(report_id); return self.repository.create({"report_id": report_id, **data})
    def list(self, report_id): self.report_service.get(report_id); return self.repository.list_by_report(report_id)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)


class InsightEventService(BaseService):
    def __init__(self, db: Session):
        self.repository = InsightEventRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); return self.repository.create(data)
    def list(self, workspace_id=None, severity=None, event_type=None, limit=100, offset=0): return self.repository.list(workspace_id, severity, event_type, limit, offset)


class UsageMetricService(BaseService):
    def __init__(self, db: Session):
        self.repository = UsageMetricRepository(db)

    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); return self.repository.create(data)
    def list(self, workspace_id=None, service_name=None, metric_name=None, limit=100, offset=0): return self.repository.list(workspace_id, service_name, metric_name, limit, offset)
