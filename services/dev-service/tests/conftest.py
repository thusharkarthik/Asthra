import os
from collections.abc import Generator
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_dev.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.schemas import EnvironmentCreate, RepositoryCreate, ServiceCreate  # noqa: E402
from app.services.services import EnvironmentService, RepositoryService, ServiceCatalogService  # noqa: E402

TEST_DB_PATH = Path(__file__).parent / "test_asthra_dev.db"
engine = create_engine(f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try: yield session
    finally:
        session.close(); Base.metadata.drop_all(bind=engine)

def create_repo(db): return RepositoryService(db).create(RepositoryCreate(workspace_id=1, project_id=1, name="repo", provider="github"))
def create_env(db): return EnvironmentService(db).create(EnvironmentCreate(workspace_id=1, name="prod", environment_type="prod"))
def create_service(db):
    repo = create_repo(db)
    return ServiceCatalogService(db).create(ServiceCreate(workspace_id=1, repository_id=repo.id, name="api", lifecycle_status="active"))
