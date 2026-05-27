from app.schemas.comment import TicketCommentCreate
from app.services.comment_service import CommentService

from .conftest import create_ticket


def test_create_and_list_ticket_comment(db):
    ticket = create_ticket(db)
    comment = CommentService(db).create(ticket.id, TicketCommentCreate(author_id=2, content="Investigating."))
    assert CommentService(db).list_by_ticket(ticket.id)[0].id == comment.id
