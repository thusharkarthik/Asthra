from app.schemas.on_call_schedule import OnCallScheduleCreate
from app.services.services import OnCallScheduleService


def test_create_list_get_on_call_schedule(db):
    schedule = OnCallScheduleService(db).create(OnCallScheduleCreate(workspace_id=1, name="Primary", timezone="UTC"))
    assert OnCallScheduleService(db).list(workspace_id=1)[0].id == schedule.id
    assert OnCallScheduleService(db).get(schedule.id).name == "Primary"
