from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import AuditEvent, ComplianceCheck, RiskFinding, SecurityPolicy


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.add(SecurityPolicy(workspace_id=1, name="Default access policy", policy_type="access", status="active"))
        db.add(AuditEvent(workspace_id=1, actor_user_id=1, entity_type="policy", action="security_policy.created", severity="low"))
        db.add(ComplianceCheck(workspace_id=1, framework="SOC2", control="CC6.1", status="pending"))
        db.add(RiskFinding(workspace_id=1, title="Sample privileged access review", severity="medium", status="open"))
        db.commit()
        print("Seeded Guard defaults")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
