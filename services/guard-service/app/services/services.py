from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.access_review_repository import AccessReviewRepository
from app.repositories.audit_event_repository import AuditEventRepository
from app.repositories.compliance_check_repository import ComplianceCheckRepository
from app.repositories.data_retention_policy_repository import DataRetentionPolicyRepository
from app.repositories.risk_finding_repository import RiskFindingRepository
from app.repositories.security_exception_repository import SecurityExceptionRepository
from app.repositories.security_policy_repository import SecurityPolicyRepository


class BaseService:
    not_found_message = "Record not found."

    def _get_or_404(self, repository, item_id: int):
        item = repository.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.not_found_message)
        return item

    @staticmethod
    def _required(value, message: str) -> None:
        if value is None or value == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class SecurityPolicyService(BaseService):
    not_found_message = "Security policy not found."

    def __init__(self, db: Session):
        self.repository = SecurityPolicyRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("name"), "policy name is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, policy_type=None, status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, policy_type, status, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)

    def delete(self, item_id: int) -> None:
        self.repository.delete(self.get(item_id))


class AccessReviewService(BaseService):
    not_found_message = "Access review not found."

    def __init__(self, db: Session):
        self.repository = AccessReviewRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("name"), "access review name is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, status=None, reviewer_id=None, limit=100, offset=0):
        return self.repository.list(workspace_id, status, reviewer_id, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)


class ComplianceCheckService(BaseService):
    not_found_message = "Compliance check not found."

    def __init__(self, db: Session):
        self.repository = ComplianceCheckRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("framework"), "framework is required")
        self._required(data.get("control"), "control is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, framework=None, status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, framework, status, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)


class AuditEventService(BaseService):
    not_found_message = "Audit event not found."

    def __init__(self, db: Session):
        self.repository = AuditEventRepository(db)

    def create(self, data: dict):
        self._required(data.get("action"), "audit event action is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, actor_user_id=None, entity_type=None, action=None, severity=None, limit=100, offset=0):
        return self.repository.list(workspace_id, actor_user_id, entity_type, action, severity, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)


class DataRetentionPolicyService(BaseService):
    not_found_message = "Data retention policy not found."

    def __init__(self, db: Session):
        self.repository = DataRetentionPolicyRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("name"), "policy name is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, data_type=None, status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, data_type, status, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)

    def delete(self, item_id: int) -> None:
        self.repository.delete(self.get(item_id))


class RiskFindingService(BaseService):
    not_found_message = "Risk finding not found."

    def __init__(self, db: Session):
        self.repository = RiskFindingRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("title"), "risk finding title is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, severity=None, status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, severity, status, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)


class SecurityExceptionService(BaseService):
    not_found_message = "Security exception not found."

    def __init__(self, db: Session):
        self.repository = SecurityExceptionRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("title"), "security exception title is required")
        self._required(data.get("reason"), "security exception reason is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, status=None, requested_by_id=None, limit=100, offset=0):
        return self.repository.list(workspace_id, status, requested_by_id, limit, offset)

    def get(self, item_id: int):
        return self._get_or_404(self.repository, item_id)

    def update(self, item_id: int, data: dict):
        return self.repository.update(self.get(item_id), data)
