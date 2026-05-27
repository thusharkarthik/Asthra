from app.schemas.approval import ApprovalCreate, ApprovalUpdate
from app.services.approval_service import ApprovalService

from .conftest import create_ticket


def test_create_list_update_approval(db):
    ticket = create_ticket(db)
    approval = ApprovalService(db).create(ticket.id, ApprovalCreate(approver_id=2))
    assert ApprovalService(db).list_by_ticket(ticket.id)[0].id == approval.id
    assert ApprovalService(db).update(approval.id, ApprovalUpdate(status="approved")).status == "approved"
