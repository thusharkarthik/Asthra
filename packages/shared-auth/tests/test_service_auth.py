from shared_auth.service_auth import build_service_token_placeholder, validate_service_token_placeholder


def test_service_auth_placeholders():
    token = build_service_token_placeholder("event-service")

    assert token == "service-token-placeholder:event-service"
    assert validate_service_token_placeholder(token) is True
    assert validate_service_token_placeholder("invalid") is False
