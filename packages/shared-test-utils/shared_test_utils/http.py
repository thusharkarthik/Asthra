def build_dummy_auth_header(token: str = "test-token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_test_client(app):
    try:
        from fastapi.testclient import TestClient
    except ImportError as exc:
        raise RuntimeError("fastapi is required to create a TestClient.") from exc
    return TestClient(app)
