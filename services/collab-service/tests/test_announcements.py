import pytest
from fastapi import HTTPException
from app.schemas.schemas import AnnouncementCreate, AnnouncementUpdate
from app.services.services import AnnouncementService

def test_announcement_crud(db):
    ann = AnnouncementService(db).create(AnnouncementCreate(workspace_id=1, title="Notice", content="Content", status="draft", created_by_id=1))
    assert AnnouncementService(db).list(workspace_id=1, created_by_id=1, status="draft", limit=10, offset=0)[0].id == ann.id
    assert AnnouncementService(db).get(ann.id).title == "Notice"
    assert AnnouncementService(db).update(ann.id, AnnouncementUpdate(status="published")).status == "published"
    AnnouncementService(db).delete(ann.id)
    with pytest.raises(HTTPException): AnnouncementService(db).get(ann.id)
