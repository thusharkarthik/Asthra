from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.approval import ApprovalCreate, ApprovalRead
from app.schemas.comment import TicketCommentCreate, TicketCommentRead
from app.schemas.escalation import EscalationCreate, EscalationRead
from app.schemas.ticket import TicketAIClassificationRead, TicketCreate, TicketRead, TicketUpdate
from app.services.approval_service import ApprovalService
from app.services.comment_service import CommentService
from app.services.escalation_service import EscalationService
from app.services.ticket_service import TicketService

router = APIRouter()


@router.post("", response_model=TicketRead, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db)):
    return TicketService(db).create(data)


@router.get("", response_model=list[TicketRead])
def list_tickets(
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    queue_id: int | None = Query(default=None),
    assignee_id: int | None = Query(default=None),
    requester_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return TicketService(db).list(
        workspace_id=workspace_id,
        project_id=project_id,
        status=status,
        priority=priority,
        queue_id=queue_id,
        assignee_id=assignee_id,
        requester_id=requester_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return TicketService(db).get(ticket_id)


@router.post("/{ticket_id}/ai-classify", response_model=TicketAIClassificationRead)
def ai_classify_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return TicketService(db).ai_classify(ticket_id)


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db)):
    return TicketService(db).update(ticket_id, data)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    TicketService(db).delete(ticket_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{ticket_id}/approvals", response_model=ApprovalRead, status_code=201)
def create_approval(ticket_id: int, data: ApprovalCreate, db: Session = Depends(get_db)):
    return ApprovalService(db).create(ticket_id, data)


@router.get("/{ticket_id}/approvals", response_model=list[ApprovalRead])
def list_approvals(ticket_id: int, db: Session = Depends(get_db)):
    return ApprovalService(db).list_by_ticket(ticket_id)


@router.post("/{ticket_id}/escalations", response_model=EscalationRead, status_code=201)
def create_escalation(ticket_id: int, data: EscalationCreate, db: Session = Depends(get_db)):
    return EscalationService(db).create(ticket_id, data)


@router.get("/{ticket_id}/escalations", response_model=list[EscalationRead])
def list_escalations(ticket_id: int, db: Session = Depends(get_db)):
    return EscalationService(db).list_by_ticket(ticket_id)


@router.post("/{ticket_id}/comments", response_model=TicketCommentRead, status_code=201)
def create_comment(ticket_id: int, data: TicketCommentCreate, db: Session = Depends(get_db)):
    return CommentService(db).create(ticket_id, data)


@router.get("/{ticket_id}/comments", response_model=list[TicketCommentRead])
def list_comments(ticket_id: int, db: Session = Depends(get_db)):
    return CommentService(db).list_by_ticket(ticket_id)
