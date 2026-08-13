from app.services.idea_service import IdeaService

from .conftest import create_idea


def test_prepare_idea_memory_document_payload(db):
    idea = create_idea(db)

    payload = IdeaService(db).prepare_memory_document(idea.id)

    assert payload.source_type == "idea"
    assert payload.external_reference == f"idea:{idea.id}"
    assert payload.workspace_id == idea.workspace_id
    assert "Signals are scattered" in payload.content
