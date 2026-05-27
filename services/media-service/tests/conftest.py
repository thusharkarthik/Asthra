import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_media.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.schemas.schemas import MediaAssetCreate  # noqa: E402
from app.services.media_service import AssetService  # noqa: E402

TEST_DB_PATH = Path(__file__).parent / "test_asthra_media.db"
engine = create_engine(f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close(); Base.metadata.drop_all(bind=engine)


def create_asset(db: Session):
    return AssetService(db).create(MediaAssetCreate(workspace_id=1, uploaded_by_id=1, title="Sample", asset_type="image", file_url="https://example.com/a.png").model_dump(by_alias=False))
