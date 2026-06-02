from app.schemas.knowledge_document import KnowledgeDocumentUpdate
from app.services.document_service import DocumentService

from .conftest import create_document


def test_create_list_get_update_and_delete_document(db, monkeypatch):
    published_events = []
    monkeypatch.setattr(
        "app.services.document_service.publish_event",
        lambda event_name, **kwargs: published_events.append((event_name, kwargs)),
    )
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
    assert "memory.document.created" in [event[0] for event in published_events]
    assert "memory.document.chunked" in [event[0] for event in published_events]

    DocumentService(db).delete(document.id)
    assert DocumentService(db).list(source_id=document.source_id) == []
