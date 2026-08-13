from sqlalchemy import select

from app.models.ai_request_log import AIRequestLog
from app.providers.base_provider import BaseProvider
from app.schemas.completion import RAGCompletionRequest
from app.services.provider_service import ProviderService, ResolvedProvider
from app.services.rag_service import RAGService

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
        assert "Context:" in messages[0]["content"]
        assert "semantic chunk content" in messages[0]["content"]
        return {
            "generated_text": "RAG answer from context.",
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        }

    def health_check(self) -> bool:
        return True


class MockMemoryResponse:
    status_code = 200

    def json(self):
        return {
            "query": "What is Asthra?",
            "retrieval_type": "semantic",
            "top_k": 2,
            "result_count": 1,
            "latency_ms": 1,
            "results": [
                {
                    "chunk": {"id": 7, "document_id": 3, "chunk_index": 0, "content": "semantic chunk content", "token_count": 3, "metadata": None, "created_at": "2026-01-01T00:00:00"},
                    "document_id": 3,
                    "document_title": "Asthra overview",
                    "source_id": 2,
                    "workspace_id": 1,
                    "match_type": "semantic",
                    "score": 0.9,
                    "metadata": {"document_id": 3},
                },
            ],
        }


def test_rag_completion_uses_mocked_memory_response_and_builds_context(db, monkeypatch):
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
    monkeypatch.setattr("app.services.rag_service.httpx.post", lambda *args, **kwargs: MockMemoryResponse())

    response = RAGService(db).generate_rag_completion(
        RAGCompletionRequest(query="What is Asthra?", workspace_id=1, provider="openrouter"),
    )

    assert response.answer == "RAG answer from context."
    assert response.sources[0].content == "semantic chunk content"
    assert response.retrieval_metadata["retrieval_type"] == "semantic"
    assert db.scalars(select(AIRequestLog)).one().status == "success"


def test_rag_completion_handles_memory_service_failure(db, monkeypatch):
    def raise_request_error(*args, **kwargs):
        import httpx

        raise httpx.ConnectError("unavailable")

    monkeypatch.setattr("app.services.rag_service.httpx.post", raise_request_error)

    try:
        RAGService(db).generate_rag_completion(RAGCompletionRequest(query="What is Asthra?"))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 502
    else:
        raise AssertionError("Expected memory-service failure to raise a clean HTTP error.")
