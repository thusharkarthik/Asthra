from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import ScheduledJob, Workflow, WorkflowAction, WorkflowTrigger


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        workflow = Workflow(
            workspace_id=1,
            name="Sample manual notification workflow",
            description="Foundation sample for manual automation execution.",
            status="active",
            created_by_id=1,
        )
        db.add(workflow)
        db.flush()
        db.add(
            WorkflowTrigger(
                workflow_id=workflow.id,
                trigger_type="manual",
                trigger_config={"source": "seed"},
            )
        )
        db.add(
            WorkflowAction(
                workflow_id=workflow.id,
                action_type="create_notification",
                action_config={"message": "Sample placeholder notification"},
                execution_order=1,
            )
        )
        db.add(
            ScheduledJob(
                workflow_id=workflow.id,
                interval_seconds=3600,
                next_run_at=datetime.utcnow() + timedelta(hours=1),
                is_active=True,
            )
        )
        db.commit()
        print(f"Seeded Automation defaults with workflow {workflow.id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
