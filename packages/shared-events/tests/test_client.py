from shared_events import EventClient, EventNames


def test_event_client_noop_behavior():
    client = EventClient()
    event = client.build_event(
        event_name=EventNames.MEMORY_DOCUMENT_CREATED,
        source_service="memory-service",
        payload={"document_id": 1},
    )

    result = client.publish_event(event)

    assert client.enabled is False
    assert result["success"] is True
    assert result["published"] is False
    assert result["mode"] == "noop"


def test_event_client_build_event():
    client = EventClient("http://event-service:8000")
    event = client.build_event(
        event_name=EventNames.AUTOMATION_WORKFLOW_EXECUTED,
        source_service="automation-service",
        payload={"workflow_id": 1},
    )

    assert client.enabled is True
    assert event.event_name == "automation.workflow.executed"
    assert event.payload["workflow_id"] == 1
