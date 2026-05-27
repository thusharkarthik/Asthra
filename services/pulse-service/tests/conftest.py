import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_pulse.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.alert import AlertCreate  # noqa: E402
from app.schemas.incident import IncidentCreate  # noqa: E402
from app.services.services import AlertService, IncidentService  # noqa: E402

TEST_DB_PATH = Path(__file__).parent / "test_asthra_pulse.db"
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


def create_alert(db: Session):
    return AlertService(db).create(AlertCreate(workspace_id=1, title="High latency", source="test", severity="high"))


def create_incident(db: Session):
    alert = create_alert(db)
    return IncidentService(db).create(IncidentCreate(workspace_id=1, alert_id=alert.id, title="API degraded", severity="high"))
