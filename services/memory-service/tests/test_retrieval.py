from sqlalchemy import select

from app.models.retrieval_log import RetrievalLog
from app.schemas.retrieval_log import RetrievalSearchRequest
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import RetrievalService

from .conftest import create_document


def test_keyword_retrieval_search_returns_matching_chunks_and_logs_request(db):
    create_document(
        db,
        title="Release checklist",
        content="release checklist deploy validate release notes notify team",
    )

    response = RetrievalService(db).keyword_search(
        RetrievalSearchRequest(query="release", top_k=5),
    )

    assert response.retrieval_type == "keyword"
    assert response.result_count >= 1
    assert response.results[0].document_title == "Release checklist"
    assert response.results[0].match_type == "keyword"

    retrieval_log = db.scalars(select(RetrievalLog)).one()
    assert retrieval_log.query_text == "release"
    assert retrieval_log.retrieval_type == "keyword"


def test_semantic_retrieval_search_returns_indexed_chunks_and_logs_request(db):
    document = create_document(
        db,
        title="Incident response guide",
        content="incident response triage communicate resolve review",
    )
    EmbeddingService(db).generate_for_document(document.id)

    response = RetrievalService(db).semantic_search(
        RetrievalSearchRequest(query="incident triage", top_k=3, document_id=document.id),
    )

    assert response.retrieval_type == "semantic"
    assert response.result_count >= 1
    assert response.results[0].document_title == "Incident response guide"
    assert response.results[0].match_type == "semantic"
    assert response.results[0].score is not None

    retrieval_logs = db.scalars(select(RetrievalLog).order_by(RetrievalLog.id)).all()
    assert retrieval_logs[-1].query_text == "incident triage"
    assert retrieval_logs[-1].retrieval_type == "semantic"
