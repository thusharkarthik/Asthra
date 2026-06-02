from app.services.embedding_service import EmbeddingService

from .conftest import create_document


def test_placeholder_embedding_generation_creates_records(db):
    document = create_document(db)

    records, created_count, updated_count = EmbeddingService(db).generate_for_document(document.id)

    assert created_count == len(records)
    assert updated_count == 0
    assert records
    assert {record.embedding_status for record in records} == {"generated"}
    assert {record.embedding_model for record in records} == {"mock-embedding-v1"}
    assert all(record.vector_id and record.vector_id.startswith("in-memory:") for record in records)

    listed = EmbeddingService(db).list_by_document(document.id)
    assert [record.id for record in listed] == [record.id for record in records]
