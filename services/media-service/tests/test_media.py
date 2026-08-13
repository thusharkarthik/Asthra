import pytest
from fastapi import HTTPException

from app.schemas.schemas import (
    MediaAnnotationCreate,
    MediaAssetCreate,
    MediaCollectionCreate,
    MediaProcessingJobCreate,
    MediaTagCreate,
    MediaTranscriptCreate,
)
from app.services.media_service import AnnotationService, AssetService, CollectionService, ProcessingJobService, TagService, TranscriptService
from tests.conftest import create_asset


def test_asset_crud(db):
    service = AssetService(db)
    asset = service.create(MediaAssetCreate(workspace_id=1, title="Image", asset_type="image", file_url="https://example.com/i.png").model_dump(by_alias=False))
    assert len(service.list(workspace_id=1, asset_type="image")) == 1
    assert service.get(asset.id).title == "Image"
    assert service.update(asset.id, {"title": "Updated"}).title == "Updated"
    service.delete(asset.id)
    with pytest.raises(HTTPException): service.get(asset.id)


def test_collection_crud(db):
    service = CollectionService(db)
    col = service.create(MediaCollectionCreate(workspace_id=1, name="Research", created_by_id=1).model_dump())
    assert len(service.list(workspace_id=1, created_by_id=1)) == 1
    assert service.get(col.id).name == "Research"
    assert service.update(col.id, {"name": "Updated"}).name == "Updated"
    service.delete(col.id)
    with pytest.raises(HTTPException): service.get(col.id)


def test_transcript_create_list(db):
    asset = create_asset(db)
    service = TranscriptService(db)
    service.create(asset.id, MediaTranscriptCreate(transcript_text="hello", language="en").model_dump())
    assert len(service.list(asset.id)) == 1


def test_annotation_create_list(db):
    asset = create_asset(db)
    service = AnnotationService(db)
    service.create(asset.id, MediaAnnotationCreate(annotation_type="note", content="important").model_dump())
    assert len(service.list(asset.id)) == 1


def test_processing_job_create_list_update(db):
    asset = create_asset(db)
    service = ProcessingJobService(db)
    job = service.create(asset.id, MediaProcessingJobCreate(job_type="ocr_placeholder").model_dump())
    assert len(service.list(asset_id=asset.id, status="pending")) == 1
    assert service.update(job.id, {"status": "running"}).status == "running"


def test_tag_create_list_attach_list(db):
    asset = create_asset(db)
    service = TagService(db)
    tag = service.create(MediaTagCreate(name="diagram").model_dump())
    assert len(service.list()) == 1
    assert service.attach(asset.id, tag.id).name == "diagram"
    assert len(service.list_for_asset(asset.id)) == 1
    with pytest.raises(HTTPException):
        service.create(MediaTagCreate(name="diagram").model_dump())
