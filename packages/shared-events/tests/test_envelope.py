import pytest

from shared_events import EventEnvelope, EventNames, build_event_envelope


def test_event_envelope_creation():
    event = EventEnvelope(
        event_name=EventNames.CORE_ORGANIZATION_CREATED,
        source_service="core-service",
        organization_id=1,
        actor_user_id=10,
        entity_type="organization",
        entity_id="1",
        payload={"name": "Asthra"},
        request_id="req-1",
    )

    assert event.event_id
    assert event.event_name == "core.organization.created"
    assert event.payload == {"name": "Asthra"}
    assert event.request_id == "req-1"


def test_build_event_envelope_payload_structure():
    event = build_event_envelope(
        event_name=EventNames.FLOW_WORK_ITEM_CREATED,
        source_service="flow-service",
        workspace_id=1,
        entity_type="work_item",
        entity_id="42",
        payload={"title": "Test item"},
    )
    payload = event.model_dump(mode="json")

    assert payload["event_name"] == "flow.work_item.created"
    assert payload["workspace_id"] == 1
    assert payload["payload"]["title"] == "Test item"
    assert "occurred_at" in payload


def test_invalid_event_name_rejected():
    with pytest.raises(ValueError):
        EventEnvelope(event_name="invalid", source_service="test-service")
