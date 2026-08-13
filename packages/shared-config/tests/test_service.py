from shared_config import ServiceConfig, build_service_config


def test_service_config_creation():
    config = build_service_config(
        app_name="asthra-core-service",
        app_version="0.1.0",
        environment="development",
        api_prefix="/api/v1",
        debug=True,
        database_url="sqlite:///./test.db",
    )

    assert isinstance(config, ServiceConfig)
    assert config.app_name == "asthra-core-service"
    assert config.debug is True
    assert config.database_url == "sqlite:///./test.db"
