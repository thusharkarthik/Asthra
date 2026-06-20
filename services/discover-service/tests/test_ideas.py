import pytest
from fastapi import HTTPException

from app.schemas.idea import IdeaUpdate
from app.schemas.idea import IdeaCreate
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

    approved = IdeaService(db).approve(idea.id)
    assert approved.status == "approved"

    rejected = IdeaService(db).reject(idea.id)
    assert rejected.status == "rejected"

    converted = IdeaService(db).mark_converted_to_work(idea.id)
    assert converted.status == "converted_to_work"

    IdeaService(db).delete(idea.id)
    with pytest.raises(HTTPException):
        IdeaService(db).get(idea.id)


def test_create_idea_with_ui_aliases_and_scores(db):
    idea = IdeaService(db).create(
        IdeaCreate(
            workspace_id=1,
            project_id=10,
            title="Score discovery idea",
            description="Validate scored idea creation.",
            problem="The UI sends a problem alias.",
            target_user="Product operator",
            business_value="Improve product planning.",
            impact_score=8,
            confidence_score=7,
            effort_score=3,
            status="captured",
            created_by_id=1,
        ),
    )

    assert idea.problem_statement == "The UI sends a problem alias."
    assert idea.target_users == "Product operator"
    assert idea.business_value == "Improve product planning."
    assert idea.impact_score == 8
    assert idea.confidence_score == 7
    assert idea.effort_score == 3
