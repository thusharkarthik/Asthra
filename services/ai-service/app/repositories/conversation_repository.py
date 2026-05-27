from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.schemas.conversation import ConversationCreate, ConversationMessageCreate


class ConversationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, conversation_create: ConversationCreate) -> Conversation:
        conversation = Conversation(**conversation_create.model_dump())
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def list(
        self,
        *,
        workspace_id: int | None = None,
        user_id: int | None = None,
    ) -> list[Conversation]:
        statement = select(Conversation)
        if workspace_id is not None:
            statement = statement.where(Conversation.workspace_id == workspace_id)
        if user_id is not None:
            statement = statement.where(Conversation.user_id == user_id)
        statement = statement.order_by(Conversation.id)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, conversation_id: int) -> Conversation | None:
        return self.db.get(Conversation, conversation_id)

    def delete(self, conversation: Conversation) -> None:
        self.db.delete(conversation)
        self.db.commit()

    def create_message(
        self,
        conversation_id: int,
        message_create: ConversationMessageCreate,
    ) -> ConversationMessage:
        message = ConversationMessage(
            conversation_id=conversation_id,
            **message_create.model_dump(),
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(self, conversation_id: int) -> list[ConversationMessage]:
        statement = (
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.id)
        )
        return list(self.db.scalars(statement).all())
