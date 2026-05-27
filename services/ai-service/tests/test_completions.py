from sqlalchemy import select

from app.models.ai_request_log import AIRequestLog
from app.providers.base_provider import BaseProvider
from app.schemas.completion import ChatCompletionRequest, ChatMessage
from app.services.provider_service import ProviderService, ResolvedProvider

from .conftest import create_provider


class MockProvider(BaseProvider):
    def generate_completion(
        self,
        *,
        messages,
        system_prompt=None,
        temperature=None,
        max_tokens=None,
    ):
        return {
            "generated_text": "Mock provider response.",
            "usage": {
                "prompt_tokens": 3,
                "completion_tokens": 4,
                "total_tokens": 7,
            },
        }

    def health_check(self) -> bool:
        return True


def test_chat_completion_uses_mock_provider_and_logs_request(db, monkeypatch):
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

    response = ProviderService(db).generate_chat_completion(
        ChatCompletionRequest(
            provider="openrouter",
            messages=[
                ChatMessage(role="user", content="Summarize Asthra Intelligence."),
            ],
        ),
    )

    assert response.generated_text == "Mock provider response."
    assert response.provider == "openrouter"
    assert response.usage.total_tokens == 7

    request_log = db.scalars(select(AIRequestLog)).one()
    assert request_log.status == "success"
    assert request_log.request_type == "chat_completion"
