from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas.schemas import (
    MediaAnnotationCreate, MediaAnnotationRead, MediaAssetCreate, MediaAssetRead, MediaAssetUpdate,
    MediaCollectionCreate, MediaCollectionRead, MediaCollectionUpdate, MediaProcessingJobCreate,
    MediaProcessingJobRead, MediaProcessingJobUpdate, MediaTagCreate, MediaTagRead, MediaTranscriptCreate,
    MediaTranscriptRead,
)
from app.services.media_service import AnnotationService, AssetService, CollectionService, ProcessingJobService, TagService, TranscriptService

api_router = APIRouter()


def _dump(schema, item, by_alias=False): return schema.model_validate(item).model_dump(mode="json", by_alias=by_alias)


@api_router.post("/media-assets", status_code=status.HTTP_201_CREATED)
def create_asset(payload: MediaAssetCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaAssetRead, AssetService(db).create(payload.model_dump(by_alias=False)), True))
@api_router.get("/media-assets")
def list_assets(workspace_id: int | None = None, asset_type: str | None = None, uploaded_by_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaAssetRead, i, True) for i in AssetService(db).list(workspace_id, asset_type, uploaded_by_id, limit, offset)])
@api_router.get("/media-assets/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)): return success_response(data=_dump(MediaAssetRead, AssetService(db).get(asset_id), True))
@api_router.patch("/media-assets/{asset_id}")
def update_asset(asset_id: int, payload: MediaAssetUpdate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaAssetRead, AssetService(db).update(asset_id, payload.model_dump(exclude_unset=True, by_alias=False)), True))
@api_router.delete("/media-assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int, db: Session = Depends(get_db)): AssetService(db).delete(asset_id); return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/media-collections", status_code=status.HTTP_201_CREATED)
def create_collection(payload: MediaCollectionCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaCollectionRead, CollectionService(db).create(payload.model_dump())))
@api_router.get("/media-collections")
def list_collections(workspace_id: int | None = None, created_by_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaCollectionRead, i) for i in CollectionService(db).list(workspace_id, created_by_id, limit, offset)])
@api_router.get("/media-collections/{collection_id}")
def get_collection(collection_id: int, db: Session = Depends(get_db)): return success_response(data=_dump(MediaCollectionRead, CollectionService(db).get(collection_id)))
@api_router.patch("/media-collections/{collection_id}")
def update_collection(collection_id: int, payload: MediaCollectionUpdate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaCollectionRead, CollectionService(db).update(collection_id, payload.model_dump(exclude_unset=True))))
@api_router.delete("/media-collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(collection_id: int, db: Session = Depends(get_db)): CollectionService(db).delete(collection_id); return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/media-assets/{asset_id}/transcripts", status_code=status.HTTP_201_CREATED)
def create_transcript(asset_id: int, payload: MediaTranscriptCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaTranscriptRead, TranscriptService(db).create(asset_id, payload.model_dump())))
@api_router.get("/media-assets/{asset_id}/transcripts")
def list_transcripts(asset_id: int, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaTranscriptRead, i) for i in TranscriptService(db).list(asset_id)])
@api_router.post("/media-assets/{asset_id}/annotations", status_code=status.HTTP_201_CREATED)
def create_annotation(asset_id: int, payload: MediaAnnotationCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaAnnotationRead, AnnotationService(db).create(asset_id, payload.model_dump())))
@api_router.get("/media-assets/{asset_id}/annotations")
def list_annotations(asset_id: int, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaAnnotationRead, i) for i in AnnotationService(db).list(asset_id)])


@api_router.post("/media-assets/{asset_id}/processing-jobs", status_code=status.HTTP_201_CREATED)
def create_job(asset_id: int, payload: MediaProcessingJobCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaProcessingJobRead, ProcessingJobService(db).create(asset_id, payload.model_dump())))
@api_router.get("/processing-jobs")
def list_jobs(asset_id: int | None = None, status: str | None = None, job_type: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaProcessingJobRead, i) for i in ProcessingJobService(db).list(asset_id, status, job_type, limit, offset)])
@api_router.patch("/processing-jobs/{job_id}")
def update_job(job_id: int, payload: MediaProcessingJobUpdate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaProcessingJobRead, ProcessingJobService(db).update(job_id, payload.model_dump(exclude_unset=True))))


@api_router.post("/media-tags", status_code=status.HTTP_201_CREATED)
def create_tag(payload: MediaTagCreate, db: Session = Depends(get_db)): return success_response(data=_dump(MediaTagRead, TagService(db).create(payload.model_dump())))
@api_router.get("/media-tags")
def list_tags(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaTagRead, i) for i in TagService(db).list(limit, offset)])
@api_router.post("/media-assets/{asset_id}/tags", status_code=status.HTTP_201_CREATED)
def attach_tag(asset_id: int, tag_id: int, db: Session = Depends(get_db)): return success_response(data=_dump(MediaTagRead, TagService(db).attach(asset_id, tag_id)))
@api_router.get("/media-assets/{asset_id}/tags")
def list_asset_tags(asset_id: int, db: Session = Depends(get_db)): return success_response(data=[_dump(MediaTagRead, i) for i in TagService(db).list_for_asset(asset_id)])
