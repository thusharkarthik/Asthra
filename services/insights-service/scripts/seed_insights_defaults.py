from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Dashboard, DashboardWidget, InsightEvent, MetricDefinition, MetricSnapshot, Report


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        dashboard = Dashboard(workspace_id=1, name="Workspace health", created_by_id=1)
        db.add(dashboard)
        db.flush()
        db.add(DashboardWidget(dashboard_id=dashboard.id, widget_type="kpi", title="Open work"))
        db.add(MetricDefinition(workspace_id=1, metric_key="work.open_count", name="Open work count", unit="count", source_service="flow-service"))
        db.add(MetricSnapshot(workspace_id=1, metric_key="work.open_count", value=42, entity_type="workspace", entity_id=1))
        db.add(Report(workspace_id=1, name="Weekly operations", report_type="operations", status="active"))
        db.add(InsightEvent(workspace_id=1, event_type="project_health", severity="info", title="Sample project health signal"))
        db.commit()
        print(f"Seeded Insights defaults with dashboard {dashboard.id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
