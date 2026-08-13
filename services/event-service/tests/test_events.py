from app.schemas import EventRecordCreate
from app.services.event_service import EventService


def test_publish_list_and_get_event(db_session):
    service = EventService(db_session)
    event = service.publish(
        EventRecordCreate(
            event_id="evt-test-1",
            event_name="core.organization.created",
            source_service="core-service",
            organization_id=1,
            entity_type="organization",
            entity_id="1",
            payload={"name": "Asthra"},
        )
    )

    events = service.list_events(source_service="core-service")
    fetched = service.get_event("evt-test-1")

    assert event.event_id == "evt-test-1"
    assert len(events) == 1
    assert fetched.entity_type == "organization"
