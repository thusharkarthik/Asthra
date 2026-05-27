from sqlalchemy import select

from app.models.retrieval_log import RetrievalLog
from app.schemas.retrieval_log import RetrievalSearchRequest
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
