from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.conversation import ConversationCreate, ConversationMessageCreate


class ConversationService:
    def __init__(self, db: Session) -> None:
        self.conversation_repository = ConversationRepository(db)

    def create(self, conversation_create: ConversationCreate) -> Conversation:
        # TODO: Replace fallback title with AI-assisted title generation in a later tier.
        if conversation_create.title is None:
            conversation_create = ConversationCreate(
                workspace_id=conversation_create.workspace_id,
                user_id=conversation_create.user_id,
                title="Untitled conversation",
            )
        return self.conversation_repository.create(conversation_create)

    def list(
        self,
        *,
        workspace_id: int | None = None,
        user_id: int | None = None,
    ) -> list[Conversation]:
        return self.conversation_repository.list(workspace_id=workspace_id, user_id=user_id)

    def get(self, conversation_id: int) -> Conversation:
        conversation = self.conversation_repository.get_by_id(conversation_id)
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )
        return conversation

    def delete(self, conversation_id: int) -> None:
        conversation = self.get(conversation_id)
        self.conversation_repository.delete(conversation)

    def create_message(
        self,
        conversation_id: int,
        message_create: ConversationMessageCreate,
    ) -> ConversationMessage:
        self.get(conversation_id)
        return self.conversation_repository.create_message(conversation_id, message_create)

    def list_messages(self, conversation_id: int) -> list[ConversationMessage]:
        self.get(conversation_id)
        return self.conversation_repository.list_messages(conversation_id)
