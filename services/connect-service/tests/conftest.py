import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_connect.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.schemas import IntegrationCreate, WebhookEndpointCreate  # noqa: E402
from app.services.integration_service import IntegrationService  # noqa: E402
from app.services.webhook_service import WebhookEndpointService  # noqa: E402


TEST_DB_PATH = Path(__file__).parent / "test_asthra_connect.db"
engine = create_engine(f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def create_integration(db: Session):
    return IntegrationService(db).create(
        IntegrationCreate(
            workspace_id=1,
            name="GitHub",
            provider="github",
            status="inactive",
            created_by_id=1,
        ).model_dump()
    )


def create_webhook(db: Session):
    return WebhookEndpointService(db).create(
        WebhookEndpointCreate(
            workspace_id=1,
            name="Events",
            target_url="https://example.com/webhook",
        ).model_dump()
    )
