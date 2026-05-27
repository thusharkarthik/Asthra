from app.schemas.schemas import SyncJobCreate
from app.services.sync_job_service import SyncJobService
from tests.conftest import create_integration


def test_create_list_get_update_sync_job(db):
    integration = create_integration(db)
    service = SyncJobService(db)
    job = service.create(
        SyncJobCreate(integration_id=integration.id, job_type="full_sync", status="pending").model_dump()
    )

    assert len(service.list(integration_id=integration.id, job_type="full_sync")) == 1
    assert service.get(job.id).status == "pending"
    assert service.update(job.id, {"status": "running"}).status == "running"
