from sqlalchemy import select

from app.models.embedding_record import EmbeddingRecord
from app.models.retrieval_log import RetrievalLog
from app.schemas.ingestion import MemoryIngestRequest
from app.schemas.workspace_search import WorkspaceSearchRequest
from app.services.ingestion_service import IngestionService
from app.services.retrieval_service import RetrievalService


def test_generic_ingestion_chunks_embeds_and_indexes_document(db, monkeypatch):
    events = []
    monkeypatch.setattr("app.services.ingestion_service.publish_event", lambda event_name, **kwargs: events.append(event_name))
    monkeypatch.setattr("app.services.document_service.publish_event", lambda event_name, **kwargs: events.append(event_name))
    monkeypatch.setattr("app.services.embedding_service.publish_event", lambda event_name, **kwargs: events.append(event_name))

    response = IngestionService(db).ingest(
        MemoryIngestRequest(
            source_type="docs_page",
            external_reference="page:42",
            workspace_id=1,
            title="Workspace onboarding",
            content="workspace onboarding invite users create projects track work",
            metadata={"page_id": 42},
        ),
    )

    assert response.document_id > 0
    assert response.chunks_created > 0
    assert response.embeddings_created > 0
    assert db.scalars(select(EmbeddingRecord)).all()
    assert "memory.document.ingested" in events
    assert "memory.document.chunked" in events
    assert "memory.embedding.generated" in events


def test_workspace_search_returns_indexed_memory_results_and_logs(db, monkeypatch):
    monkeypatch.setattr("app.services.ingestion_service.publish_event", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.services.document_service.publish_event", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.services.embedding_service.publish_event", lambda *args, **kwargs: None)
    search_events = []
    monkeypatch.setattr("app.services.retrieval_service.publish_event", lambda event_name, **kwargs: search_events.append(event_name))
    IngestionService(db).ingest(
        MemoryIngestRequest(
            source_type="support_ticket",
            external_reference="ticket:7",
            workspace_id=2,
            title="Login ticket",
            content="login failure password reset identity support",
            metadata={"ticket_id": 7},
        ),
    )

    response = RetrievalService(db).workspace_search(
        WorkspaceSearchRequest(workspace_id=2, query="login support", top_k=3),
    )

    assert response.result_count >= 1
    assert response.results[0].source_type == "support_ticket"
    assert response.results[0].source_reference == "ticket:7"
    assert "login" in response.results[0].chunk
    assert "memory.workspace.search" in search_events
    assert db.scalars(select(RetrievalLog)).all()
