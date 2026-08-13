from app.schemas.schemas import ComplianceCheckCreate
from app.services.compliance_check_service import ComplianceCheckService


def test_create_list_get_update_compliance_check(db):
    service = ComplianceCheckService(db)
    check = service.create(
        ComplianceCheckCreate(workspace_id=1, framework="SOC2", control="CC6.1").model_dump()
    )
    assert len(service.list(workspace_id=1, framework="SOC2")) == 1
    assert service.get(check.id).control == "CC6.1"
    assert service.update(check.id, {"status": "completed"}).status == "completed"
