import os
import socket
import subprocess
import sys
import time
from collections.abc import Generator
from pathlib import Path
from typing import Any

import httpx
import pytest

SERVICE_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_PATH = Path(__file__).resolve().parent / "test_asthra_core.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ENVIRONMENT"] = "test"
os.environ["BCRYPT_ROUNDS"] = "4"

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402


def _get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


@pytest.fixture(scope="session")
def server_url() -> Generator[str, None, None]:
    port = _get_free_port()
    url = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
    env["SECRET_KEY"] = "test-secret-key"
    env["ENVIRONMENT"] = "test"
    env["BCRYPT_ROUNDS"] = "4"

    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=SERVICE_ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        deadline = time.monotonic() + 20
        with httpx.Client(base_url=url, timeout=1.0, trust_env=False) as probe_client:
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    raise RuntimeError("Test server exited before becoming ready.")
                try:
                    response = probe_client.get("/health")
                    if response.status_code == 200:
                        break
                except httpx.HTTPError:
                    time.sleep(0.1)
            else:
                raise RuntimeError("Timed out waiting for test server.")

        yield url
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


@pytest.fixture(autouse=True)
def reset_test_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(server_url: str) -> Generator[httpx.Client, None, None]:
    with httpx.Client(base_url=server_url, timeout=10.0, trust_env=False) as test_client:
        yield test_client


def create_test_user(
    client: httpx.Client,
    *,
    email: str = "user@example.com",
    password: str = "password123",
    full_name: str = "Test User",
) -> dict[str, Any]:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert response.status_code == 201
    return response.json()


def get_auth_token(
    client: httpx.Client,
    *,
    email: str = "user@example.com",
    password: str = "password123",
) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_auth_headers(
    client: httpx.Client,
    *,
    email: str = "user@example.com",
    password: str = "password123",
) -> dict[str, str]:
    create_test_user(client, email=email, password=password)
    token = get_auth_token(client, email=email, password=password)
    return auth_headers(token)


def create_test_organization(
    client: httpx.Client,
    headers: dict[str, str],
    *,
    name: str = "Acme",
) -> dict[str, Any]:
    response = client.post(
        "/api/v1/organizations",
        json={"name": name, "description": "Test organization"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def create_test_workspace(
    client: httpx.Client,
    headers: dict[str, str],
    organization_id: int,
    *,
    name: str = "Engineering",
) -> dict[str, Any]:
    response = client.post(
        "/api/v1/workspaces",
        json={
            "organization_id": organization_id,
            "name": name,
            "description": "Test workspace",
        },
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()
