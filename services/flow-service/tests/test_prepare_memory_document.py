from app.services.work_item_service import WorkItemService

from .conftest import create_work_item


def test_prepare_work_item_memory_document_payload(db):
    work_item = create_work_item(db, title="Break down onboarding")

    payload = WorkItemService(db).prepare_memory_document(work_item.id)

    assert payload.source_type == "work_item"
    assert payload.external_reference == f"work_item:{work_item.id}"
    assert payload.workspace_id == 0
    assert payload.metadata["project_id"] == work_item.project_id
