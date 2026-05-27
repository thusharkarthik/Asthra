from sqlalchemy.orm import Session

from app.models import AccessReview, AuditEvent, ComplianceCheck, DataRetentionPolicy, RiskFinding, SecurityException, SecurityPolicy


class BaseRepository:
    model: type

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        item = self.model(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data: dict):
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item) -> None:
        self.db.delete(item)
        self.db.commit()


class SecurityPolicyRepository(BaseRepository):
    model = SecurityPolicy

    def list(self, workspace_id=None, policy_type=None, status=None, limit=100, offset=0):
        query = self.db.query(SecurityPolicy)
        if workspace_id is not None:
            query = query.filter(SecurityPolicy.workspace_id == workspace_id)
        if policy_type is not None:
            query = query.filter(SecurityPolicy.policy_type == policy_type)
        if status is not None:
            query = query.filter(SecurityPolicy.status == status)
        return query.order_by(SecurityPolicy.id.desc()).offset(offset).limit(limit).all()


class AccessReviewRepository(BaseRepository):
    model = AccessReview

    def list(self, workspace_id=None, status=None, reviewer_id=None, limit=100, offset=0):
        query = self.db.query(AccessReview)
        if workspace_id is not None:
            query = query.filter(AccessReview.workspace_id == workspace_id)
        if status is not None:
            query = query.filter(AccessReview.status == status)
        if reviewer_id is not None:
            query = query.filter(AccessReview.reviewer_id == reviewer_id)
        return query.order_by(AccessReview.id.desc()).offset(offset).limit(limit).all()


class ComplianceCheckRepository(BaseRepository):
    model = ComplianceCheck

    def list(self, workspace_id=None, framework=None, status=None, limit=100, offset=0):
        query = self.db.query(ComplianceCheck)
        if workspace_id is not None:
            query = query.filter(ComplianceCheck.workspace_id == workspace_id)
        if framework is not None:
            query = query.filter(ComplianceCheck.framework == framework)
        if status is not None:
            query = query.filter(ComplianceCheck.status == status)
        return query.order_by(ComplianceCheck.id.desc()).offset(offset).limit(limit).all()


class AuditEventRepository(BaseRepository):
    model = AuditEvent

    def list(self, workspace_id=None, actor_user_id=None, entity_type=None, action=None, severity=None, limit=100, offset=0):
        query = self.db.query(AuditEvent)
        if workspace_id is not None:
            query = query.filter(AuditEvent.workspace_id == workspace_id)
        if actor_user_id is not None:
            query = query.filter(AuditEvent.actor_user_id == actor_user_id)
        if entity_type is not None:
            query = query.filter(AuditEvent.entity_type == entity_type)
        if action is not None:
            query = query.filter(AuditEvent.action == action)
        if severity is not None:
            query = query.filter(AuditEvent.severity == severity)
        return query.order_by(AuditEvent.id.desc()).offset(offset).limit(limit).all()


class DataRetentionPolicyRepository(BaseRepository):
    model = DataRetentionPolicy

    def list(self, workspace_id=None, data_type=None, status=None, limit=100, offset=0):
        query = self.db.query(DataRetentionPolicy)
        if workspace_id is not None:
            query = query.filter(DataRetentionPolicy.workspace_id == workspace_id)
        if data_type is not None:
            query = query.filter(DataRetentionPolicy.data_type == data_type)
        if status is not None:
            query = query.filter(DataRetentionPolicy.status == status)
        return query.order_by(DataRetentionPolicy.id.desc()).offset(offset).limit(limit).all()


class RiskFindingRepository(BaseRepository):
    model = RiskFinding

    def list(self, workspace_id=None, severity=None, status=None, limit=100, offset=0):
        query = self.db.query(RiskFinding)
        if workspace_id is not None:
            query = query.filter(RiskFinding.workspace_id == workspace_id)
        if severity is not None:
            query = query.filter(RiskFinding.severity == severity)
        if status is not None:
            query = query.filter(RiskFinding.status == status)
        return query.order_by(RiskFinding.id.desc()).offset(offset).limit(limit).all()


class SecurityExceptionRepository(BaseRepository):
    model = SecurityException

    def list(self, workspace_id=None, status=None, requested_by_id=None, limit=100, offset=0):
        query = self.db.query(SecurityException)
        if workspace_id is not None:
            query = query.filter(SecurityException.workspace_id == workspace_id)
        if status is not None:
            query = query.filter(SecurityException.status == status)
        if requested_by_id is not None:
            query = query.filter(SecurityException.requested_by_id == requested_by_id)
        return query.order_by(SecurityException.id.desc()).offset(offset).limit(limit).all()
