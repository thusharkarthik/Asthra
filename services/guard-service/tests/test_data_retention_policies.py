import pytest
from fastapi import HTTPException

from app.schemas.schemas import DataRetentionPolicyCreate
from app.services.data_retention_policy_service import DataRetentionPolicyService


def test_create_list_get_update_delete_data_retention_policy(db):
    service = DataRetentionPolicyService(db)
    policy = service.create(
        DataRetentionPolicyCreate(workspace_id=1, name="Audit retention", data_type="audit_events", retention_days=365).model_dump()
    )
    assert len(service.list(workspace_id=1, data_type="audit_events")) == 1
    assert service.get(policy.id).retention_days == 365
    assert service.update(policy.id, {"status": "active"}).status == "active"
    service.delete(policy.id)
    with pytest.raises(HTTPException):
        service.get(policy.id)
