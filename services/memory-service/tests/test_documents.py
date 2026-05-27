from app.schemas.knowledge_document import KnowledgeDocumentUpdate
from app.services.document_service import DocumentService

from .conftest import create_document


def test_create_list_get_update_and_delete_document(db):
    document = create_document(db, title="Release process")

    documents = DocumentService(db).list(source_id=document.source_id)
    assert [item.id for item in documents] == [document.id]

    fetched = DocumentService(db).get(document.id)
    assert fetched.title == "Release process"

    updated = DocumentService(db).update(
        document.id,
        KnowledgeDocumentUpdate(title="Updated release process"),
    )
    assert updated.title == "Updated release process"

    DocumentService(db).delete(document.id)
    assert DocumentService(db).list(source_id=document.source_id) == []
