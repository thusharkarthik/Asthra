from app.providers.base_provider import BaseProvider
from app.schemas.completion import WorkspaceRAGCompletionRequest
from app.services.provider_service import ProviderService, ResolvedProvider
from app.services.rag_service import RAGService

from .conftest import create_provider


class MockProvider(BaseProvider):
    def generate_completion(self, *, messages, system_prompt=None, temperature=None, max_tokens=None):
        assert "Workspace Context:" in messages[0]["content"]
        assert "login failure context" in messages[0]["content"]
        return {"generated_text": "Workspace RAG answer.", "usage": None}

    def health_check(self) -> bool:
        return True


class MockWorkspaceMemoryResponse:
    status_code = 200

    def json(self):
        return {
            "workspace_id": 1,
            "query": "Why are users blocked?",
            "top_k": 3,
            "result_count": 1,
            "results": [
                {
                    "source_type": "support_ticket",
                    "title": "Login ticket",
                    "chunk": "login failure context",
                    "relevance_score": 0.91,
                    "source_reference": "support_ticket:10",
                    "document_id": 4,
                    "chunk_id": 9,
                    "metadata": {"ticket_id": 10},
                },
            ],
        }


def test_workspace_rag_completion_uses_mocked_workspace_search(db, monkeypatch):
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
    monkeypatch.setattr("app.services.rag_service.httpx.post", lambda *args, **kwargs: MockWorkspaceMemoryResponse())

    response = RAGService(db).generate_workspace_rag_completion(
        WorkspaceRAGCompletionRequest(query="Why are users blocked?", workspace_id=1, provider="openrouter"),
    )

    assert response.answer == "Workspace RAG answer."
    assert response.sources[0].source_type == "support_ticket"
    assert response.sources[0].source_reference == "support_ticket:10"
    assert response.retrieval_metadata["retrieval_type"] == "workspace_semantic"
