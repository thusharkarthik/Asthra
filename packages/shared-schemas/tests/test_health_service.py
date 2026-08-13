from shared_schemas import HealthResponse, ReadinessResponse, ServiceInfoResponse


def test_health_and_readiness_schema_creation():
    health = HealthResponse(status="ok", service="asthra-core-service")
    ready = ReadinessResponse(status="ready", database="ok")

    assert health.status == "ok"
    assert ready.database == "ok"


def test_service_info_schema_creation():
    info = ServiceInfoResponse(
        service="asthra-core-service",
        version="0.1.0",
        environment="development",
        api_prefix="/api/v1",
    )

    assert info.service == "asthra-core-service"
    assert info.api_prefix == "/api/v1"
