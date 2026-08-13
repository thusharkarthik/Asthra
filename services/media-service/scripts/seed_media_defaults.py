from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import MediaAsset, MediaCollection, MediaProcessingJob, MediaTag


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        asset = MediaAsset(workspace_id=1, uploaded_by_id=1, title="Sample diagram", asset_type="image", file_url="https://example.com/diagram.png", file_name="diagram.png")
        db.add(asset)
        db.flush()
        db.add(MediaCollection(workspace_id=1, name="Product research media", created_by_id=1))
        db.add(MediaProcessingJob(asset_id=asset.id, job_type="ocr_placeholder", status="pending"))
        db.add(MediaTag(name="research"))
        db.commit()
        print(f"Seeded Media defaults with asset {asset.id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
