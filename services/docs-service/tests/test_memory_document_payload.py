from app.api.v1.pages import prepare_memory_document

from .conftest import create_page


def test_prepare_memory_document_endpoint_returns_expected_payload(db):
    page = create_page(db, title="RAG page", content="Docs content for memory indexing")

    payload = prepare_memory_document(page.id, db=db, _=None)

    assert payload.title == "RAG page"
    assert payload.content == "Docs content for memory indexing"
    assert payload.workspace_id == page.space.workspace_id
    assert payload.source_type == "docs_page"
    assert payload.external_reference == f"page:{page.id}"
    assert payload.metadata["page_id"] == page.id
