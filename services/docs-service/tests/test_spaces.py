from fastapi import HTTPException

from app.schemas.space import SpaceUpdate
from app.services.space_service import SpaceService
from tests.conftest import create_space


def test_space_crud(db):
    space = create_space(db, name="Product Docs")
    service = SpaceService(db)

    spaces = service.list(workspace_id=1)
    assert len(spaces) == 1

    fetched_space = service.get(space.id)
    assert fetched_space.name == "Product Docs"

    updated_space = service.update(space.id, SpaceUpdate(name="Product Knowledge"))
    assert updated_space.name == "Product Knowledge"

    scoped_space = service.update(space.id, SpaceUpdate(project_id=10))
    assert scoped_space.project_id == 10

    service.delete(space.id)

    try:
        service.get(space.id)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected deleted space to return 404.")
