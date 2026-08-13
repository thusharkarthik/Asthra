import pytest
from fastapi import HTTPException

from app.schemas.roadmap_item import RoadmapItemCreate, RoadmapItemUpdate
from app.services.roadmap_item_service import RoadmapItemService

from .conftest import create_idea


def test_create_list_update_delete_roadmap_item(db):
    idea = create_idea(db)
    item = RoadmapItemService(db).create(
        RoadmapItemCreate(
            workspace_id=1,
            idea_id=idea.id,
            title="Discovery inbox MVP",
            description="First release",
            target_quarter="2026-Q3",
            status="planned",
            sort_order=1,
        ),
    )

    items = RoadmapItemService(db).list(workspace_id=1, status="planned", target_quarter="2026-Q3", limit=10, offset=0)
    assert [entry.id for entry in items] == [item.id]

    updated = RoadmapItemService(db).update(item.id, RoadmapItemUpdate(status="in_progress"))
    assert updated.status == "in_progress"

    RoadmapItemService(db).delete(item.id)
    with pytest.raises(HTTPException):
        RoadmapItemService(db).get(item.id)
