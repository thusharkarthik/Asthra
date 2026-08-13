import pytest
from fastapi import HTTPException

from app.schemas.conversation import ConversationCreate, ConversationMessageCreate
from app.services.conversation_service import ConversationService


def test_conversation_and_message_lifecycle(db):
    service = ConversationService(db)

    conversation = service.create(
        ConversationCreate(
            workspace_id=1,
            user_id=10,
            title=None,
        ),
    )
    assert conversation.title == "Untitled conversation"

    conversations = service.list(workspace_id=1, user_id=10)
    assert [item.id for item in conversations] == [conversation.id]

    message = service.create_message(
        conversation.id,
        ConversationMessageCreate(
            role="user",
            content="Create a short summary.",
            token_count=5,
        ),
    )
    assert message.conversation_id == conversation.id

    messages = service.list_messages(conversation.id)
    assert [item.id for item in messages] == [message.id]

    service.delete(conversation.id)

    with pytest.raises(HTTPException) as exc_info:
        service.get(conversation.id)
    assert exc_info.value.status_code == 404
