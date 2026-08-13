from shared_observability import aggregate_health, service_health


def test_health_aggregation():
    result = aggregate_health([
        service_health("core-service"),
        service_health("flow-service"),
    ])

    assert result["status"] == "ok"
    assert len(result["services"]) == 2


def test_degraded_health_aggregation():
    result = aggregate_health([
        service_health("core-service"),
        service_health("flow-service", status="down"),
    ])

    assert result["status"] == "degraded"
