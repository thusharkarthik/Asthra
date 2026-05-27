from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import EventSubscription, Integration, SyncJob, WebhookEndpoint


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        integration = Integration(
            workspace_id=1,
            name="Sample GitHub integration",
            provider="github",
            status="inactive",
            configuration={"mode": "placeholder"},
            created_by_id=1,
        )
        db.add(integration)
        db.flush()
        db.add(WebhookEndpoint(workspace_id=1, name="Product events webhook", target_url="https://example.com/webhook"))
        db.add(EventSubscription(workspace_id=1, event_name="work_item.created", subscriber_type="webhook", subscriber_reference="sample"))
        db.add(SyncJob(integration_id=integration.id, job_type="full_sync", status="pending"))
        db.commit()
        print(f"Seeded Connect defaults with integration {integration.id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
