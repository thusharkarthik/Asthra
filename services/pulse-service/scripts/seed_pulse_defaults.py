from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.schemas.alert import AlertCreate
from app.schemas.escalation_policy import EscalationPolicyCreate
from app.schemas.incident import IncidentCreate
from app.schemas.status_page import StatusPageComponentCreate, StatusPageCreate
from app.services.services import AlertService, ComponentService, EscalationPolicyService, IncidentService, StatusPageService


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        alert = AlertService(db).create(AlertCreate(workspace_id=1, title="High error rate", source="seed", severity="high"))
        incident = IncidentService(db).create(IncidentCreate(workspace_id=1, alert_id=alert.id, title="API degradation", severity="high"))
        page = StatusPageService(db).create(StatusPageCreate(workspace_id=1, name="Asthra Status", is_public=True))
        ComponentService(db).create(page.id, StatusPageComponentCreate(name="Core API", status="degraded"))
        EscalationPolicyService(db).create(EscalationPolicyCreate(workspace_id=1, name="Primary escalation", steps="Notify on-call, then engineering lead."))
        print(f"Seeded Pulse defaults with alert {alert.id} and incident {incident.id}.")


if __name__ == "__main__":
    main()
