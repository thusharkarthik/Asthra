from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.schemas.incident import IncidentCreate
from app.schemas.queue import QueueCreate
from app.schemas.sla import SLACreate
from app.schemas.ticket import TicketCreate
from app.services.incident_service import IncidentService
from app.services.queue_service import QueueService
from app.services.sla_service import SLAService
from app.services.ticket_service import TicketService


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        queue = QueueService(db).create(QueueCreate(workspace_id=1, name="General Support", description="Default support intake."))
        QueueService(db).create(QueueCreate(workspace_id=1, name="Engineering Triage", description="Technical issue routing."))
        SLAService(db).create(SLACreate(workspace_id=1, name="Medium priority SLA", response_time_minutes=120, resolution_time_minutes=2880, priority="medium"))
        ticket = TicketService(db).create(TicketCreate(workspace_id=1, queue_id=queue.id, title="Sample support ticket", description="Customer needs help with workspace access.", priority="medium", requester_id=1))
        IncidentService(db).create(IncidentCreate(workspace_id=1, ticket_id=ticket.id, title="Sample incident", description="Example service disruption.", severity="medium"))
        print(f"Seeded Desk defaults with ticket {ticket.id}.")


if __name__ == "__main__":
    main()
