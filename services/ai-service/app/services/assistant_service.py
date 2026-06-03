from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assistant import AssistantMessage, AssistantSession
from app.repositories.assistant_repository import AssistantRepository
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantMessageCreate,
    AssistantSessionCreate,
    AssistantSource,
    AssistantToolUsage,
)
from app.schemas.completion import ChatCompletionRequest, ChatMessage
from app.services.assistant_context_service import AssistantContextService
from app.services.event_publisher import publish_event
from app.services.provider_service import ProviderService
from app.tools import get_tool_registry


class AssistantService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AssistantRepository(db)
        self.context_service = AssistantContextService()
        self.tool_registry = get_tool_registry()

    def create_session(self, data: AssistantSessionCreate) -> AssistantSession:
        if data.title is None:
            data = AssistantSessionCreate(workspace_id=data.workspace_id, user_id=data.user_id, title="Assistant session")
        session = self.repository.create_session(data)
        publish_event(
            "ai.assistant.session.created",
            payload={"title": session.title},
            workspace_id=session.workspace_id,
            actor_user_id=session.user_id,
            entity_type="assistant_session",
            entity_id=str(session.id),
        )
        return session

    def list_sessions(self, *, workspace_id: int | None = None, user_id: int | None = None) -> list[AssistantSession]:
        return self.repository.list_sessions(workspace_id=workspace_id, user_id=user_id)

    def get_session(self, session_id: int) -> AssistantSession:
        session = self.repository.get_session(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assistant session not found.")
        return session

    def delete_session(self, session_id: int) -> None:
        self.repository.delete_session(self.get_session(session_id))

    def create_message(self, session_id: int, data: AssistantMessageCreate) -> AssistantMessage:
        self.get_session(session_id)
        message = self.repository.create_message(session_id, data)
        publish_event(
            "ai.assistant.message.created",
            payload={"role": message.role},
            workspace_id=message.session.workspace_id,
            actor_user_id=message.session.user_id,
            entity_type="assistant_message",
            entity_id=str(message.id),
        )
        return message

    def list_messages(self, session_id: int) -> list[AssistantMessage]:
        self.get_session(session_id)
        return self.repository.list_messages(session_id)

    def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        session = self._resolve_session(request)
        user_message = self.create_message(
            session.id,
            AssistantMessageCreate(role="user", content=request.message, metadata={"source": "assistant_chat"}),
        )
        sources, context_metadata = self.context_service.retrieve_workspace_context(
            workspace_id=request.workspace_id,
            query=request.message,
            top_k=request.top_k,
        )
        self.repository.create_contexts(
            session_id=session.id,
            message_id=user_message.id,
            sources=[source.model_dump() for source in sources],
        )
        tool_usage = self._run_read_only_tools(request, session.id, user_message.id)
        prompt = self._build_prompt(
            message=request.message,
            history=self.repository.list_messages(session.id),
            sources=sources,
            tool_usage=tool_usage,
        )
        completion = ProviderService(self.db).generate_chat_completion(
            ChatCompletionRequest(
                provider=request.provider,
                model=request.model,
                system_prompt="You are Asthra Assistant. Answer with workspace context. Do not take autonomous actions.",
                messages=[ChatMessage(role="user", content=prompt)],
            ),
        )
        assistant_message = self.create_message(
            session.id,
            AssistantMessageCreate(
                role="assistant",
                content=completion.generated_text,
                metadata={"provider": completion.provider, "model": completion.model},
            ),
        )
        response = self.repository.create_response(
            session_id=session.id,
            message_id=assistant_message.id,
            answer=completion.generated_text,
            provider=completion.provider,
            model=completion.model,
            retrieval_metadata=context_metadata,
        )
        publish_event(
            "ai.assistant.response.generated",
            payload={"provider": completion.provider, "model": completion.model, "source_count": len(sources)},
            workspace_id=session.workspace_id,
            actor_user_id=session.user_id,
            entity_type="assistant_response",
            entity_id=str(response.id),
        )
        return AssistantChatResponse(
            session_id=session.id,
            message_id=assistant_message.id,
            response_id=response.id,
            answer=response.answer,
            sources=sources,
            context_metadata=context_metadata,
            tool_usage=tool_usage,
            provider=completion.provider,
            model=completion.model,
        )

    def _resolve_session(self, request: AssistantChatRequest) -> AssistantSession:
        if request.session_id is not None:
            session = self.get_session(request.session_id)
            if session.workspace_id != request.workspace_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session workspace does not match request.")
            return session
        return self.create_session(
            AssistantSessionCreate(workspace_id=request.workspace_id, user_id=request.user_id, title="Assistant chat"),
        )

    def _run_read_only_tools(self, request: AssistantChatRequest, session_id: int, message_id: int) -> list[AssistantToolUsage]:
        tool_result = self.tool_registry.execute("memory_search", workspace_id=request.workspace_id, query=request.message)
        tool_call = self.repository.create_tool_call(
            session_id=session_id,
            message_id=message_id,
            tool_name="memory_search",
            status=tool_result["status"],
            input_data=tool_result.get("input"),
            output_data=tool_result,
        )
        return [
            AssistantToolUsage(
                tool_name=tool_call.tool_name,
                status=tool_call.status,
                input=tool_call.input_,
                output=tool_call.output_,
            ),
        ]

    def _build_prompt(
        self,
        *,
        message: str,
        history: list[AssistantMessage],
        sources: list[AssistantSource],
        tool_usage: list[AssistantToolUsage],
    ) -> str:
        context = self.context_service.build_context_text(sources)
        recent_history = "\n".join(f"{item.role}: {item.content}" for item in history[-8:])
        tools = "\n".join(f"- {tool.tool_name}: {tool.status}" for tool in tool_usage)
        return (
            f"Conversation history:\n{recent_history}\n\n"
            f"Retrieved workspace context:\n{context}\n\n"
            f"Read-only tools considered:\n{tools or 'none'}\n\n"
            f"User request:\n{message}"
        )
