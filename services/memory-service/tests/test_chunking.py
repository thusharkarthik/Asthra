from app.schemas.knowledge_document import KnowledgeDocumentUpdate
from app.services.document_service import DocumentService

from .conftest import create_document


def test_document_creation_automatically_creates_chunks(db):
    document = create_document(
        db,
        content="one two three four five six seven eight nine",
    )

    chunks = DocumentService(db).list_chunks(document.id)

    assert [chunk.chunk_index for chunk in chunks] == [0, 1]
    assert chunks[0].content == "one two three four five"
    assert chunks[1].content == "five six seven eight nine"


def test_document_content_update_rebuilds_chunks(db):
    document = create_document(db, content="one two three four five six")

    DocumentService(db).update(
        document.id,
        KnowledgeDocumentUpdate(content="alpha beta gamma delta epsilon zeta"),
    )
    chunks = DocumentService(db).list_chunks(document.id)

    assert chunks[0].content == "alpha beta gamma delta epsilon"
    assert chunks[1].content == "epsilon zeta"
