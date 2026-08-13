import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

TEST_DATABASE_PATH = Path(__file__).resolve().parent / "test_asthra_docs.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.page import PageCreate  # noqa: E402
from app.schemas.space import SpaceCreate  # noqa: E402
from app.services.page_service import PageService  # noqa: E402
from app.services.space_service import SpaceService  # noqa: E402


engine = create_engine(
    f"sqlite:///{TEST_DATABASE_PATH}",
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def create_space(
    db: Session,
    *,
    workspace_id: int = 1,
    name: str = "Engineering Docs",
    created_by_id: int = 1,
):
    return SpaceService(db).create(
        SpaceCreate(
            workspace_id=workspace_id,
            name=name,
            description="Created by test helper",
            created_by_id=created_by_id,
        ),
    )


def create_page(
    db: Session,
    *,
    title: str = "Getting Started",
    content: str = "Welcome to Asthra Docs",
    status: str = "draft",
    created_by_id: int = 1,
    parent_page_id: int | None = None,
):
    space = create_space(db)
    return PageService(db).create(
        PageCreate(
            space_id=space.id,
            parent_page_id=parent_page_id,
            title=title,
            content=content,
            status=status,
            created_by_id=created_by_id,
        ),
    )
