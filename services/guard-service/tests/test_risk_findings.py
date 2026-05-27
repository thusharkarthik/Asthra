from app.schemas.schemas import RiskFindingCreate
from app.services.risk_finding_service import RiskFindingService


def test_create_list_get_update_risk_finding(db):
    service = RiskFindingService(db)
    finding = service.create(
        RiskFindingCreate(workspace_id=1, title="Privileged access risk", severity="high").model_dump()
    )
    assert len(service.list(workspace_id=1, severity="high")) == 1
    assert service.get(finding.id).title == "Privileged access risk"
    assert service.update(finding.id, {"status": "mitigated"}).status == "mitigated"
