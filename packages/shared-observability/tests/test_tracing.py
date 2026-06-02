from shared_observability import start_trace_span


def test_trace_span_placeholder():
    span = start_trace_span("test-operation", {"service": "core"})

    assert span.name == "test-operation"
    assert span.attributes["service"] == "core"
    assert span.finish().ended_at is not None
