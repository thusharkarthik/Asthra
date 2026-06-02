from shared_auth.auth_headers import build_authorization_header, extract_bearer_token, forward_auth_headers


def test_extract_bearer_token():
    assert extract_bearer_token("Bearer abc123") == "abc123"
    assert extract_bearer_token("bearer abc123") == "abc123"


def test_malformed_header_handling():
    assert extract_bearer_token(None) is None
    assert extract_bearer_token("") is None
    assert extract_bearer_token("Basic abc123") is None
    assert extract_bearer_token("Bearer") is None
    assert extract_bearer_token("Bearer abc extra") is None


def test_build_authorization_header():
    assert build_authorization_header("token") == {"Authorization": "Bearer token"}


def test_forward_auth_headers():
    assert forward_auth_headers({"Authorization": "Bearer token", "X-Other": "value"}) == {"Authorization": "Bearer token"}
    assert forward_auth_headers({"authorization": "Bearer token"}) == {"Authorization": "Bearer token"}
    assert forward_auth_headers({"X-Other": "value"}) == {}
