from app.schemas.schemas import AuditEventCreate
from app.services.audit_event_service import AuditEventService


def test_create_list_get_audit_event(db):
    service = AuditEventService(db)
    event = service.create(
        AuditEventCreate(
            workspace_id=1,
            actor_user_id=1,
            entity_type="security_policy",
            action="security_policy.created",
            severity="low",
        ).model_dump(by_alias=False)
    )
    assert len(service.list(workspace_id=1, actor_user_id=1, entity_type="security_policy")) == 1
    assert service.get(event.id).action == "security_policy.created"
