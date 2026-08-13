from sqlalchemy.orm import Session

from app.models import MediaAnnotation, MediaAsset, MediaCollection, MediaProcessingJob, MediaTag, MediaTranscript


class BaseRepository:
    model: type

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        item = self.model(**data)
        self.db.add(item); self.db.commit(); self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data: dict):
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit(); self.db.refresh(item)
        return item

    def delete(self, item) -> None:
        self.db.delete(item); self.db.commit()


class AssetRepository(BaseRepository):
    model = MediaAsset
    def list(self, workspace_id=None, asset_type=None, uploaded_by_id=None, limit=100, offset=0):
        q = self.db.query(MediaAsset)
        if workspace_id is not None: q = q.filter(MediaAsset.workspace_id == workspace_id)
        if asset_type is not None: q = q.filter(MediaAsset.asset_type == asset_type)
        if uploaded_by_id is not None: q = q.filter(MediaAsset.uploaded_by_id == uploaded_by_id)
        return q.order_by(MediaAsset.id.desc()).offset(offset).limit(limit).all()


class CollectionRepository(BaseRepository):
    model = MediaCollection
    def list(self, workspace_id=None, created_by_id=None, limit=100, offset=0):
        q = self.db.query(MediaCollection)
        if workspace_id is not None: q = q.filter(MediaCollection.workspace_id == workspace_id)
        if created_by_id is not None: q = q.filter(MediaCollection.created_by_id == created_by_id)
        return q.order_by(MediaCollection.id.desc()).offset(offset).limit(limit).all()


class TranscriptRepository(BaseRepository):
    model = MediaTranscript
    def list_by_asset(self, asset_id: int): return self.db.query(MediaTranscript).filter(MediaTranscript.asset_id == asset_id).order_by(MediaTranscript.id.asc()).all()


class AnnotationRepository(BaseRepository):
    model = MediaAnnotation
    def list_by_asset(self, asset_id: int): return self.db.query(MediaAnnotation).filter(MediaAnnotation.asset_id == asset_id).order_by(MediaAnnotation.id.asc()).all()


class ProcessingJobRepository(BaseRepository):
    model = MediaProcessingJob
    def list(self, asset_id=None, status=None, job_type=None, limit=100, offset=0):
        q = self.db.query(MediaProcessingJob)
        if asset_id is not None: q = q.filter(MediaProcessingJob.asset_id == asset_id)
        if status is not None: q = q.filter(MediaProcessingJob.status == status)
        if job_type is not None: q = q.filter(MediaProcessingJob.job_type == job_type)
        return q.order_by(MediaProcessingJob.id.desc()).offset(offset).limit(limit).all()


class TagRepository(BaseRepository):
    model = MediaTag
    def get_by_name(self, name: str): return self.db.query(MediaTag).filter(MediaTag.name == name).first()
    def list(self, limit=100, offset=0): return self.db.query(MediaTag).order_by(MediaTag.name.asc()).offset(offset).limit(limit).all()
