from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assistant import AssistantContext, AssistantMessage, AssistantResponse, AssistantSession, AssistantToolCall
from app.schemas.assistant import AssistantMessageCreate, AssistantSessionCreate


class AssistantRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_session(self, data: AssistantSessionCreate) -> AssistantSession:
        session = AssistantSession(**data.model_dump(), status="active")
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, *, workspace_id: int | None = None, user_id: int | None = None) -> list[AssistantSession]:
        statement = select(AssistantSession)
        if workspace_id is not None:
            statement = statement.where(AssistantSession.workspace_id == workspace_id)
        if user_id is not None:
            statement = statement.where(AssistantSession.user_id == user_id)
        statement = statement.order_by(AssistantSession.id)
        return list(self.db.scalars(statement).all())

    def get_session(self, session_id: int) -> AssistantSession | None:
        return self.db.get(AssistantSession, session_id)

    def delete_session(self, session: AssistantSession) -> None:
        self.db.delete(session)
        self.db.commit()

    def create_message(self, session_id: int, data: AssistantMessageCreate) -> AssistantMessage:
        values = data.model_dump()
        metadata = values.pop("metadata", None)
        message = AssistantMessage(session_id=session_id, **values, metadata_=metadata)
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(self, session_id: int) -> list[AssistantMessage]:
        statement = select(AssistantMessage).where(AssistantMessage.session_id == session_id).order_by(AssistantMessage.id)
        return list(self.db.scalars(statement).all())

    def create_contexts(self, *, session_id: int, message_id: int, sources: list[dict]) -> list[AssistantContext]:
        contexts: list[AssistantContext] = []
        for source in sources:
            context = AssistantContext(
                session_id=session_id,
                message_id=message_id,
                source_type=source.get("source_type"),
                source_reference=source.get("source_reference"),
                title=source.get("title"),
                content=source.get("content") or "",
                relevance_score=source.get("relevance_score"),
                metadata_=source.get("metadata"),
            )
            self.db.add(context)
            contexts.append(context)
        self.db.commit()
        for context in contexts:
            self.db.refresh(context)
        return contexts

    def create_tool_call(
        self,
        *,
        session_id: int,
        message_id: int,
        tool_name: str,
        status: str,
        input_data: dict | None = None,
        output_data: dict | None = None,
    ) -> AssistantToolCall:
        tool_call = AssistantToolCall(
            session_id=session_id,
            message_id=message_id,
            tool_name=tool_name,
            status=status,
            input_=input_data,
            output_=output_data,
        )
        self.db.add(tool_call)
        self.db.commit()
        self.db.refresh(tool_call)
        return tool_call

    def create_response(
        self,
        *,
        session_id: int,
        message_id: int,
        answer: str,
        provider: str | None,
        model: str | None,
        retrieval_metadata: dict | None,
    ) -> AssistantResponse:
        response = AssistantResponse(
            session_id=session_id,
            message_id=message_id,
            answer=answer,
            provider=provider,
            model=model,
            retrieval_metadata=retrieval_metadata,
        )
        self.db.add(response)
        self.db.commit()
        self.db.refresh(response)
        return response
