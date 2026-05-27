from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.media_repository import AnnotationRepository, AssetRepository, CollectionRepository, ProcessingJobRepository, TagRepository, TranscriptRepository


class BaseService:
    not_found_message = "Record not found."

    def _get_or_404(self, repo, item_id: int):
        item = repo.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.not_found_message)
        return item

    @staticmethod
    def _required(value, message):
        if value is None or value == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class AssetService(BaseService):
    not_found_message = "Media asset not found."
    def __init__(self, db: Session): self.repository = AssetRepository(db)
    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("title"), "title is required"); self._required(data.get("file_url"), "file_url is required"); return self.repository.create(data)
    def list(self, workspace_id=None, asset_type=None, uploaded_by_id=None, limit=100, offset=0): return self.repository.list(workspace_id, asset_type, uploaded_by_id, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)
    def delete(self, item_id): self.repository.delete(self.get(item_id))


class CollectionService(BaseService):
    not_found_message = "Media collection not found."
    def __init__(self, db: Session): self.repository = CollectionRepository(db)
    def create(self, data): self._required(data.get("workspace_id"), "workspace_id is required"); self._required(data.get("name"), "collection name is required"); return self.repository.create(data)
    def list(self, workspace_id=None, created_by_id=None, limit=100, offset=0): return self.repository.list(workspace_id, created_by_id, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)
    def delete(self, item_id): self.repository.delete(self.get(item_id))


class TranscriptService(BaseService):
    def __init__(self, db: Session): self.repository = TranscriptRepository(db); self.assets = AssetService(db)
    def create(self, asset_id, data): self.assets.get(asset_id); return self.repository.create({"asset_id": asset_id, **data})
    def list(self, asset_id): self.assets.get(asset_id); return self.repository.list_by_asset(asset_id)


class AnnotationService(BaseService):
    def __init__(self, db: Session): self.repository = AnnotationRepository(db); self.assets = AssetService(db)
    def create(self, asset_id, data): self.assets.get(asset_id); return self.repository.create({"asset_id": asset_id, **data})
    def list(self, asset_id): self.assets.get(asset_id); return self.repository.list_by_asset(asset_id)


class ProcessingJobService(BaseService):
    not_found_message = "Processing job not found."
    def __init__(self, db: Session): self.repository = ProcessingJobRepository(db); self.assets = AssetService(db)
    def create(self, asset_id, data): self.assets.get(asset_id); return self.repository.create({"asset_id": asset_id, **data})
    def list(self, asset_id=None, status=None, job_type=None, limit=100, offset=0): return self.repository.list(asset_id, status, job_type, limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def update(self, item_id, data): return self.repository.update(self.get(item_id), data)


class TagService(BaseService):
    not_found_message = "Media tag not found."
    def __init__(self, db: Session): self.db = db; self.repository = TagRepository(db); self.assets = AssetService(db)
    def create(self, data):
        self._required(data.get("name"), "tag name is required")
        if self.repository.get_by_name(data["name"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag name already exists.")
        return self.repository.create(data)
    def list(self, limit=100, offset=0): return self.repository.list(limit, offset)
    def get(self, item_id): return self._get_or_404(self.repository, item_id)
    def attach(self, asset_id, tag_id):
        asset = self.assets.get(asset_id); tag = self.get(tag_id)
        if tag not in asset.tags:
            asset.tags.append(tag); self.db.commit(); self.db.refresh(asset)
        return tag
    def list_for_asset(self, asset_id): return self.assets.get(asset_id).tags
