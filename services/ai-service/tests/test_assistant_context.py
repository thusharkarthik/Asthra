from app.schemas.assistant import AssistantSource
from app.services.assistant_context_service import AssistantContextService


class MockMemoryResponse:
    status_code = 200

    def json(self):
        return {
            "workspace_id": 1,
            "query": "release risk",
            "top_k": 2,
            "result_count": 1,
            "results": [
                {
                    "source_type": "release",
                    "source_reference": "release:4",
                    "title": "Release 2.0",
                    "chunk": "release risk context",
                    "relevance_score": 0.8,
                    "metadata": {"release_id": 4},
                },
            ],
        }


def test_context_builder_retrieves_workspace_memory(monkeypatch):
    monkeypatch.setattr("app.services.assistant_context_service.httpx.post", lambda *args, **kwargs: MockMemoryResponse())

    sources, metadata = AssistantContextService().retrieve_workspace_context(
        workspace_id=1,
        query="release risk",
        top_k=2,
    )

    assert sources[0].source_type == "release"
    assert sources[0].content == "release risk context"
    assert metadata["result_count"] == 1


def test_context_builder_assembles_context_text():
    service = AssistantContextService()
    text = service.build_context_text(
        [
            AssistantSource(
                source_type="support_ticket",
                source_reference="support_ticket:9",
                title="Ticket",
                content="login failure context",
                relevance_score=0.9,
            ),
        ],
    )

    assert "[support_ticket:support_ticket:9]" in text
    assert "login failure context" in text
