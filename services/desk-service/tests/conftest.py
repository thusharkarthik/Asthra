import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_desk.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.ticket import TicketCreate  # noqa: E402
from app.services.ticket_service import TicketService  # noqa: E402


TEST_DB_PATH = Path(__file__).parent / "test_asthra_desk.db"
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


def create_ticket(db: Session):
    return TicketService(db).create(
        TicketCreate(
            workspace_id=1,
            project_id=1,
            title="Login issue",
            description="User cannot access workspace.",
            status="open",
            priority="medium",
            requester_id=10,
        ),
    )
