from app.schemas.escalation_policy import EscalationPolicyCreate
from app.services.services import EscalationPolicyService


def test_create_list_escalation_policy(db):
    policy = EscalationPolicyService(db).create(EscalationPolicyCreate(workspace_id=1, name="Primary", steps="Notify on-call."))
    assert EscalationPolicyService(db).list(workspace_id=1)[0].id == policy.id
