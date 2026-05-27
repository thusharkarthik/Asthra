from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas.schemas import (
    AccessReviewCreate,
    AccessReviewRead,
    AccessReviewUpdate,
    AuditEventCreate,
    AuditEventRead,
    ComplianceCheckCreate,
    ComplianceCheckRead,
    ComplianceCheckUpdate,
    DataRetentionPolicyCreate,
    DataRetentionPolicyRead,
    DataRetentionPolicyUpdate,
    RiskFindingCreate,
    RiskFindingRead,
    RiskFindingUpdate,
    SecurityExceptionCreate,
    SecurityExceptionRead,
    SecurityExceptionUpdate,
    SecurityPolicyCreate,
    SecurityPolicyRead,
    SecurityPolicyUpdate,
)
from app.services.access_review_service import AccessReviewService
from app.services.audit_event_service import AuditEventService
from app.services.compliance_check_service import ComplianceCheckService
from app.services.data_retention_policy_service import DataRetentionPolicyService
from app.services.risk_finding_service import RiskFindingService
from app.services.security_exception_service import SecurityExceptionService
from app.services.security_policy_service import SecurityPolicyService

api_router = APIRouter()


def _dump(schema, item, by_alias: bool = False):
    return schema.model_validate(item).model_dump(mode="json", by_alias=by_alias)


@api_router.post("/security-policies", status_code=status.HTTP_201_CREATED)
def create_security_policy(payload: SecurityPolicyCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(SecurityPolicyRead, SecurityPolicyService(db).create(payload.model_dump())))


@api_router.get("/security-policies")
def list_security_policies(workspace_id: int | None = None, policy_type: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = SecurityPolicyService(db).list(workspace_id, policy_type, status, limit, offset)
    return success_response(data=[_dump(SecurityPolicyRead, item) for item in items])


@api_router.get("/security-policies/{policy_id}")
def get_security_policy(policy_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(SecurityPolicyRead, SecurityPolicyService(db).get(policy_id)))


@api_router.patch("/security-policies/{policy_id}")
def update_security_policy(policy_id: int, payload: SecurityPolicyUpdate, db: Session = Depends(get_db)):
    item = SecurityPolicyService(db).update(policy_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(SecurityPolicyRead, item))


@api_router.delete("/security-policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_security_policy(policy_id: int, db: Session = Depends(get_db)):
    SecurityPolicyService(db).delete(policy_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/access-reviews", status_code=status.HTTP_201_CREATED)
def create_access_review(payload: AccessReviewCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(AccessReviewRead, AccessReviewService(db).create(payload.model_dump())))


@api_router.get("/access-reviews")
def list_access_reviews(workspace_id: int | None = None, status: str | None = None, reviewer_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = AccessReviewService(db).list(workspace_id, status, reviewer_id, limit, offset)
    return success_response(data=[_dump(AccessReviewRead, item) for item in items])


@api_router.get("/access-reviews/{review_id}")
def get_access_review(review_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(AccessReviewRead, AccessReviewService(db).get(review_id)))


@api_router.patch("/access-reviews/{review_id}")
def update_access_review(review_id: int, payload: AccessReviewUpdate, db: Session = Depends(get_db)):
    item = AccessReviewService(db).update(review_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(AccessReviewRead, item))


@api_router.post("/compliance-checks", status_code=status.HTTP_201_CREATED)
def create_compliance_check(payload: ComplianceCheckCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ComplianceCheckRead, ComplianceCheckService(db).create(payload.model_dump())))


@api_router.get("/compliance-checks")
def list_compliance_checks(workspace_id: int | None = None, framework: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = ComplianceCheckService(db).list(workspace_id, framework, status, limit, offset)
    return success_response(data=[_dump(ComplianceCheckRead, item) for item in items])


@api_router.get("/compliance-checks/{check_id}")
def get_compliance_check(check_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(ComplianceCheckRead, ComplianceCheckService(db).get(check_id)))


@api_router.patch("/compliance-checks/{check_id}")
def update_compliance_check(check_id: int, payload: ComplianceCheckUpdate, db: Session = Depends(get_db)):
    item = ComplianceCheckService(db).update(check_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(ComplianceCheckRead, item))


@api_router.post("/audit-events", status_code=status.HTTP_201_CREATED)
def create_audit_event(payload: AuditEventCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(AuditEventRead, AuditEventService(db).create(payload.model_dump(by_alias=False)), by_alias=True))


@api_router.get("/audit-events")
def list_audit_events(workspace_id: int | None = None, actor_user_id: int | None = None, entity_type: str | None = None, action: str | None = None, severity: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = AuditEventService(db).list(workspace_id, actor_user_id, entity_type, action, severity, limit, offset)
    return success_response(data=[_dump(AuditEventRead, item, by_alias=True) for item in items])


@api_router.get("/audit-events/{audit_event_id}")
def get_audit_event(audit_event_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(AuditEventRead, AuditEventService(db).get(audit_event_id), by_alias=True))


@api_router.post("/data-retention-policies", status_code=status.HTTP_201_CREATED)
def create_data_retention_policy(payload: DataRetentionPolicyCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(DataRetentionPolicyRead, DataRetentionPolicyService(db).create(payload.model_dump())))


@api_router.get("/data-retention-policies")
def list_data_retention_policies(workspace_id: int | None = None, data_type: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = DataRetentionPolicyService(db).list(workspace_id, data_type, status, limit, offset)
    return success_response(data=[_dump(DataRetentionPolicyRead, item) for item in items])


@api_router.get("/data-retention-policies/{policy_id}")
def get_data_retention_policy(policy_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(DataRetentionPolicyRead, DataRetentionPolicyService(db).get(policy_id)))


@api_router.patch("/data-retention-policies/{policy_id}")
def update_data_retention_policy(policy_id: int, payload: DataRetentionPolicyUpdate, db: Session = Depends(get_db)):
    item = DataRetentionPolicyService(db).update(policy_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(DataRetentionPolicyRead, item))


@api_router.delete("/data-retention-policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_retention_policy(policy_id: int, db: Session = Depends(get_db)):
    DataRetentionPolicyService(db).delete(policy_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/risk-findings", status_code=status.HTTP_201_CREATED)
def create_risk_finding(payload: RiskFindingCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(RiskFindingRead, RiskFindingService(db).create(payload.model_dump())))


@api_router.get("/risk-findings")
def list_risk_findings(workspace_id: int | None = None, severity: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = RiskFindingService(db).list(workspace_id, severity, status, limit, offset)
    return success_response(data=[_dump(RiskFindingRead, item) for item in items])


@api_router.get("/risk-findings/{finding_id}")
def get_risk_finding(finding_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(RiskFindingRead, RiskFindingService(db).get(finding_id)))


@api_router.patch("/risk-findings/{finding_id}")
def update_risk_finding(finding_id: int, payload: RiskFindingUpdate, db: Session = Depends(get_db)):
    item = RiskFindingService(db).update(finding_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(RiskFindingRead, item))


@api_router.post("/security-exceptions", status_code=status.HTTP_201_CREATED)
def create_security_exception(payload: SecurityExceptionCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(SecurityExceptionRead, SecurityExceptionService(db).create(payload.model_dump())))


@api_router.get("/security-exceptions")
def list_security_exceptions(workspace_id: int | None = None, status: str | None = None, requested_by_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = SecurityExceptionService(db).list(workspace_id, status, requested_by_id, limit, offset)
    return success_response(data=[_dump(SecurityExceptionRead, item) for item in items])


@api_router.get("/security-exceptions/{exception_id}")
def get_security_exception(exception_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(SecurityExceptionRead, SecurityExceptionService(db).get(exception_id)))


@api_router.patch("/security-exceptions/{exception_id}")
def update_security_exception(exception_id: int, payload: SecurityExceptionUpdate, db: Session = Depends(get_db)):
    item = SecurityExceptionService(db).update(exception_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(SecurityExceptionRead, item))
