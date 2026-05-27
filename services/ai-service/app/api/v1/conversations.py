from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.schemas.conversation import (
    ConversationCreate,
    ConversationMessageCreate,
    ConversationMessageRead,
    ConversationRead,
)
from app.services.conversation_service import ConversationService

router = APIRouter()


@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation_create: ConversationCreate,
    db: Session = Depends(get_db),
) -> Conversation:
    return ConversationService(db).create(conversation_create)


@router.get("", response_model=list[ConversationRead])
def list_conversations(
    workspace_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[Conversation]:
    return ConversationService(db).list(workspace_id=workspace_id, user_id=user_id)


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> Conversation:
    return ConversationService(db).get(conversation_id)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> Response:
    ConversationService(db).delete(conversation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{conversation_id}/messages",
    response_model=ConversationMessageRead,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation_message(
    conversation_id: int,
    message_create: ConversationMessageCreate,
    db: Session = Depends(get_db),
) -> ConversationMessage:
    return ConversationService(db).create_message(conversation_id, message_create)


@router.get("/{conversation_id}/messages", response_model=list[ConversationMessageRead])
def list_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> list[ConversationMessage]:
    return ConversationService(db).list_messages(conversation_id)
