from app.schemas.schemas import ReleaseCreate
from app.services.services import ReleaseService

from .conftest import create_service


def test_prepare_release_memory_document_payload(db):
    service = create_service(db)
    release = ReleaseService(db).create(ReleaseCreate(workspace_id=1, service_id=service.id, version="2.0.0"))

    payload = ReleaseService(db).prepare_memory_document(release.id)

    assert payload.source_type == "release"
    assert payload.external_reference == f"release:{release.id}"
    assert payload.workspace_id == release.workspace_id
    assert "2.0.0" in payload.content
