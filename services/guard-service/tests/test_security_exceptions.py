from app.schemas.schemas import SecurityExceptionCreate
from app.services.security_exception_service import SecurityExceptionService


def test_create_list_get_update_security_exception(db):
    service = SecurityExceptionService(db)
    exception = service.create(
        SecurityExceptionCreate(workspace_id=1, title="Temporary policy exception", reason="Migration window").model_dump()
    )
    assert len(service.list(workspace_id=1, status="open")) == 1
    assert service.get(exception.id).title == "Temporary policy exception"
    assert service.update(exception.id, {"status": "accepted"}).status == "accepted"
