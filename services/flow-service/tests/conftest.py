import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

TEST_DATABASE_PATH = Path(__file__).resolve().parent / "test_asthra_flow.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.models.board import Board  # noqa: E402
from app.models.work_item_priority import WorkItemPriority  # noqa: E402
from app.models.work_item_status import WorkItemStatus  # noqa: E402
from app.models.work_item_type import WorkItemType  # noqa: E402
from app.schemas.board import BoardCreate  # noqa: E402
from app.schemas.work_item import WorkItemCreate  # noqa: E402
from app.services.board_service import BoardService  # noqa: E402
from app.services.work_item_service import WorkItemService  # noqa: E402


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


def create_work_item_type(
    db: Session,
    *,
    name: str = "task",
    description: str | None = "Task work item",
) -> WorkItemType:
    work_item_type = WorkItemType(name=name, description=description)
    db.add(work_item_type)
    db.commit()
    db.refresh(work_item_type)
    return work_item_type


def create_status(
    db: Session,
    *,
    name: str = "todo",
    category: str = "todo",
    sort_order: int = 0,
) -> WorkItemStatus:
    status = WorkItemStatus(name=name, category=category, sort_order=sort_order)
    db.add(status)
    db.commit()
    db.refresh(status)
    return status


def create_priority(
    db: Session,
    *,
    name: str = "high",
    level: int = 3,
) -> WorkItemPriority:
    priority = WorkItemPriority(name=name, level=level)
    db.add(priority)
    db.commit()
    db.refresh(priority)
    return priority


def create_work_item(
    db: Session,
    *,
    project_id: int = 1,
    title: str = "Test work item",
    assignee_id: int | None = 2,
    reporter_id: int = 1,
):
    work_item_type = create_work_item_type(db)
    status = create_status(db)
    priority = create_priority(db)
    return WorkItemService(db).create(
        WorkItemCreate(
            project_id=project_id,
            title=title,
            description="Created by test helper",
            type_id=work_item_type.id,
            status_id=status.id,
            priority_id=priority.id,
            assignee_id=assignee_id,
            reporter_id=reporter_id,
        ),
    )


def create_board(
    db: Session,
    *,
    project_id: int = 1,
    name: str = "Delivery Board",
) -> Board:
    return BoardService(db).create(
        BoardCreate(
            project_id=project_id,
            name=name,
            description="Created by test helper",
        ),
    )
