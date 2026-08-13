from sqlalchemy import select

from app.models.assistant import AssistantContext, AssistantResponse, AssistantToolCall
from app.providers.base_provider import BaseProvider
from app.schemas.assistant import AssistantChatRequest, AssistantSessionCreate
from app.services.assistant_service import AssistantService
from app.services.provider_service import ProviderService, ResolvedProvider

from .conftest import create_provider


class MockProvider(BaseProvider):
    def generate_completion(self, *, messages, system_prompt=None, temperature=None, max_tokens=None):
        assert "Retrieved workspace context" in messages[0]["content"]
        assert "support ticket context" in messages[0]["content"]
        return {
            "generated_text": "The main blocker is a login support issue.",
            "usage": {"prompt_tokens": 12, "completion_tokens": 8, "total_tokens": 20},
        }

    def health_check(self) -> bool:
        return True


class MockMemoryResponse:
    status_code = 200

    def json(self):
        return {
            "workspace_id": 1,
            "query": "What is blocking onboarding?",
            "top_k": 5,
            "result_count": 1,
            "results": [
                {
                    "source_type": "support_ticket",
                    "source_reference": "support_ticket:22",
                    "title": "Login issue",
                    "chunk": "support ticket context",
                    "relevance_score": 0.91,
                    "metadata": {"ticket_id": 22},
                },
            ],
        }


def test_assistant_chat_creates_session_messages_context_tool_and_response(db, monkeypatch):
    provider = create_provider(db)

    def resolve_provider(self, *, provider_name, model_name):
        return ResolvedProvider(
            record=provider,
            adapter=MockProvider(
                api_key="test-key",
                model_name=model_name or provider.model_name,
                base_url=provider.base_url,
                timeout_seconds=30,
            ),
        )

    monkeypatch.setattr(ProviderService, "resolve_provider", resolve_provider)
    monkeypatch.setattr("app.services.assistant_context_service.httpx.post", lambda *args, **kwargs: MockMemoryResponse())

    response = AssistantService(db).chat(
        AssistantChatRequest(
            workspace_id=1,
            user_id=3,
            message="What is blocking onboarding?",
            provider="openrouter",
        ),
    )

    assert response.answer == "The main blocker is a login support issue."
    assert response.sources[0].source_type == "support_ticket"
    assert response.tool_usage[0].tool_name == "memory_search"
    assert response.context_metadata["retrieval_type"] == "workspace_memory"
    assert db.scalars(select(AssistantContext)).all()
    assert db.scalars(select(AssistantToolCall)).one().status == "placeholder"
    assert db.scalars(select(AssistantResponse)).one().answer == response.answer


def test_assistant_chat_continues_existing_session(db, monkeypatch):
    provider = create_provider(db)

    def resolve_provider(self, *, provider_name, model_name):
        return ResolvedProvider(
            record=provider,
            adapter=MockProvider(api_key="test-key", model_name=provider.model_name, base_url=provider.base_url, timeout_seconds=30),
        )

    monkeypatch.setattr(ProviderService, "resolve_provider", resolve_provider)
    monkeypatch.setattr("app.services.assistant_context_service.httpx.post", lambda *args, **kwargs: MockMemoryResponse())
    session = AssistantService(db).create_session(AssistantSessionCreate(workspace_id=1, user_id=3))

    response = AssistantService(db).chat(
        AssistantChatRequest(
            workspace_id=1,
            session_id=session.id,
            user_id=3,
            message="Continue",
            provider="openrouter",
        ),
    )

    assert response.session_id == session.id
    assert len(AssistantService(db).list_messages(session.id)) == 2
