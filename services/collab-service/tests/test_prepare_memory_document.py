from app.services.services import ThreadService

from .conftest import create_thread


def test_prepare_thread_memory_document_payload(db):
    thread = create_thread(db)

    payload = ThreadService(db).prepare_memory_document(thread.id)

    assert payload["source_type"] == "discussion_thread"
    assert payload["external_reference"] == f"discussion_thread:{thread.id}"
    assert payload["workspace_id"] == thread.workspace_id
    assert payload["metadata"]["thread_id"] == thread.id
