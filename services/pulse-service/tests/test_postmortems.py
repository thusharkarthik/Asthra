from app.schemas.postmortem import PostmortemCreate, PostmortemUpdate
from app.services.services import PostmortemService
from .conftest import create_incident


def test_create_get_update_postmortem(db):
    incident = create_incident(db)
    postmortem = PostmortemService(db).create(incident.id, PostmortemCreate(summary="Incident summary."))
    assert PostmortemService(db).get_by_incident(incident.id).id == postmortem.id
    assert PostmortemService(db).update(postmortem.id, PostmortemUpdate(root_cause="Config drift.")).root_cause == "Config drift."
