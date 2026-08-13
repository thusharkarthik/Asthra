import pytest
from fastapi import HTTPException
from app.schemas.schemas import ActivityCreate, TeamUpdateCreate, TeamUpdateUpdate
from app.services.services import ActivityService, TeamUpdateService

def test_activity_and_team_update(db):
    item = ActivityService(db).create(ActivityCreate(workspace_id=1, project_id=1, actor_user_id=1, entity_type="task", entity_id=1, action="created"))
    assert ActivityService(db).list(workspace_id=1, project_id=1, entity_type="task", actor_user_id=1, limit=10, offset=0)[0].id == item.id
    update = TeamUpdateService(db).create(TeamUpdateCreate(workspace_id=1, team_id=1, title="Update", content="Done", status="draft", created_by_id=1))
    assert TeamUpdateService(db).list(workspace_id=1, team_id=1, status="draft", limit=10, offset=0)[0].id == update.id
    assert TeamUpdateService(db).get(update.id).title == "Update"
    assert TeamUpdateService(db).update(update.id, TeamUpdateUpdate(status="published")).status == "published"
    TeamUpdateService(db).delete(update.id)
    with pytest.raises(HTTPException): TeamUpdateService(db).get(update.id)
