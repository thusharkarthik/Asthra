import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_automation.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.schemas import WorkflowCreate  # noqa: E402
from app.services.workflow_service import WorkflowService  # noqa: E402


TEST_DB_PATH = Path(__file__).parent / "test_asthra_automation.db"
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


def create_workflow(db: Session):
    return WorkflowService(db).create(
        WorkflowCreate(
            workspace_id=1,
            name="Test workflow",
            description="Test automation workflow",
            status="active",
            created_by_id=1,
        ).model_dump()
    )
