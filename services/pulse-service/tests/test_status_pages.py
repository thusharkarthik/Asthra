from app.schemas.status_page import StatusPageComponentCreate, StatusPageComponentUpdate, StatusPageCreate
from app.services.services import ComponentService, StatusPageService


def test_create_list_status_page_and_update_component(db):
    page = StatusPageService(db).create(StatusPageCreate(workspace_id=1, name="Public status", is_public=True))
    assert StatusPageService(db).list(workspace_id=1, is_public=True, limit=10, offset=0)[0].id == page.id
    assert StatusPageService(db).get(page.id).name == "Public status"
    component = ComponentService(db).create(page.id, StatusPageComponentCreate(name="API"))
    assert ComponentService(db).list_by_page(page.id)[0].id == component.id
    assert ComponentService(db).update(component.id, StatusPageComponentUpdate(status="degraded")).status == "degraded"
