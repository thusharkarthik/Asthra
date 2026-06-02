import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_memory.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["MEMORY_CHUNK_SIZE"] = "5"
os.environ["MEMORY_CHUNK_OVERLAP"] = "1"

from app.db.base import Base  # noqa: E402
from app.schemas.knowledge_document import KnowledgeDocumentCreate  # noqa: E402
from app.schemas.knowledge_source import KnowledgeSourceCreate  # noqa: E402
from app.services.document_service import DocumentService  # noqa: E402
from app.services.source_service import SourceService  # noqa: E402
from app.vectorstores.in_memory_vector_store import get_vector_store  # noqa: E402


TEST_DB_PATH = Path(__file__).parent / "test_asthra_memory.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    get_vector_store().clear()
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        get_vector_store().clear()
        Base.metadata.drop_all(bind=engine)


def create_source(
    db: Session,
    *,
    workspace_id: int | None = 1,
    source_type: str = "manual",
    name: str = "Test source",
):
    return SourceService(db).create(
        KnowledgeSourceCreate(
            workspace_id=workspace_id,
            source_type=source_type,
            name=name,
            external_reference=None,
        ),
    )


def create_document(
    db: Session,
    *,
    source_id: int | None = None,
    title: str = "Test document",
    content: str = "alpha beta gamma delta epsilon zeta eta theta",
):
    source = create_source(db) if source_id is None else None
    return DocumentService(db).create(
        KnowledgeDocumentCreate(
            source_id=source_id or source.id,
            title=title,
            content=content,
            content_type="text/plain",
            metadata={"test": True},
        ),
    )
