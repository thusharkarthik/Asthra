import pytest
from fastapi import HTTPException

from app.schemas.idea import IdeaUpdate
from app.services.idea_service import IdeaService

from .conftest import create_idea


def test_create_list_get_update_delete_idea(db):
    idea = create_idea(db)

    ideas = IdeaService(db).list(workspace_id=1, project_id=10, status="new", created_by_id=1, limit=10, offset=0)
    assert [item.id for item in ideas] == [idea.id]

    fetched = IdeaService(db).get(idea.id)
    assert fetched.title == "Discovery inbox"

    updated = IdeaService(db).update(idea.id, IdeaUpdate(status="validating"))
    assert updated.status == "validating"

    IdeaService(db).delete(idea.id)
    with pytest.raises(HTTPException):
        IdeaService(db).get(idea.id)
