from shared_platform.service_metadata import build_service_info


def test_build_service_info():
    info = build_service_info(
        app_name="asthra-core-service",
        app_version="0.1.0",
        environment="development",
        api_version="/api/v1",
    )

    assert info["service"] == "asthra-core-service"
    assert info["version"] == "0.1.0"
    assert info["environment"] == "development"
    assert info["api_version"] == "/api/v1"
