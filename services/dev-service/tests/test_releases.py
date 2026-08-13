from app.schemas.schemas import ReleaseCreate, ReleaseUpdate
from app.services.services import ReleaseService
from .conftest import create_service

def test_release_flow(db):
    svc = create_service(db)
    rel = ReleaseService(db).create(ReleaseCreate(workspace_id=1, service_id=svc.id, version="1.0.0"))
    assert ReleaseService(db).list(workspace_id=1, status="planned", service_id=svc.id, limit=10, offset=0)[0].id == rel.id
    assert ReleaseService(db).get(rel.id).version == "1.0.0"
    assert ReleaseService(db).update(rel.id, ReleaseUpdate(status="released")).status == "released"
