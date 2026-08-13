from fastapi import HTTPException

from app.schemas.assistant import AssistantMessageCreate, AssistantSessionCreate
from app.services.assistant_service import AssistantService


def test_assistant_session_crud(db):
    service = AssistantService(db)
    session = service.create_session(AssistantSessionCreate(workspace_id=1, user_id=7, title="Planning"))

    assert service.list_sessions(workspace_id=1)[0].id == session.id
    assert service.get_session(session.id).title == "Planning"

    service.delete_session(session.id)
    try:
        service.get_session(session.id)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected deleted assistant session to raise 404.")


def test_assistant_message_create_and_list(db):
    service = AssistantService(db)
    session = service.create_session(AssistantSessionCreate(workspace_id=1, user_id=7))

    message = service.create_message(
        session.id,
        AssistantMessageCreate(role="user", content="What changed this week?", metadata={"source": "test"}),
    )

    messages = service.list_messages(session.id)
    assert messages[0].id == message.id
    assert messages[0].role == "user"
    assert messages[0].metadata_ == {"source": "test"}
