from app.services.event_publisher import publish_event


def test_event_publisher_noop_is_safe():
    result = publish_event("memory.document.created", entity_type="knowledge_document", entity_id="1")

    assert result["success"] is True
    assert result["published"] is False
    assert result["mode"] == "noop"
