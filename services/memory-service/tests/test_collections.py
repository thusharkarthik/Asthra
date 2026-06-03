from fastapi import HTTPException

from app.schemas.memory_collection import MemoryCollectionCreate, MemoryCollectionUpdate
from app.services.collection_service import CollectionService


def test_collection_crud(db):
    service = CollectionService(db)
    collection = service.create(
        MemoryCollectionCreate(
            workspace_id=1,
            name="Workspace Knowledge",
            description="Shared workspace memory",
            collection_type="workspace_knowledge",
        ),
    )

    assert service.list(workspace_id=1)[0].id == collection.id
    assert service.get(collection.id).name == "Workspace Knowledge"
    assert service.update(collection.id, MemoryCollectionUpdate(name="Project Knowledge")).name == "Project Knowledge"

    service.delete(collection.id)
    try:
        service.get(collection.id)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected deleted collection to raise 404.")
