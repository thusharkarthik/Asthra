import pytest
from fastapi import HTTPException

from app.schemas.schemas import SecurityPolicyCreate
from app.services.security_policy_service import SecurityPolicyService


def test_create_list_get_update_delete_security_policy(db):
    service = SecurityPolicyService(db)
    policy = service.create(
        SecurityPolicyCreate(workspace_id=1, name="Access policy", policy_type="access", status="draft").model_dump()
    )
    assert len(service.list(workspace_id=1, policy_type="access")) == 1
    assert service.get(policy.id).name == "Access policy"
    assert service.update(policy.id, {"status": "active"}).status == "active"
    service.delete(policy.id)
    with pytest.raises(HTTPException):
        service.get(policy.id)
