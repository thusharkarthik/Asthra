from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

ASSET_TYPES = {"image", "video", "audio", "document", "other"}
JOB_STATUSES = {"pending", "running", "success", "failed"}


class MediaAssetCreate(BaseModel):
    workspace_id: int
    uploaded_by_id: int | None = None
    title: str = Field(min_length=1)
    description: str | None = None
    asset_type: str
    file_url: str = Field(min_length=1)
    file_name: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    metadata_json: dict[str, Any] | None = Field(default=None, alias="metadata")

    @field_validator("asset_type")
    @classmethod
    def validate_asset_type(cls, value: str) -> str:
        if value not in ASSET_TYPES:
            raise ValueError("asset_type must be image, video, audio, document, or other")
        return value


class MediaAssetUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    asset_type: str | None = None
    file_url: str | None = Field(default=None, min_length=1)
    file_name: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    metadata_json: dict[str, Any] | None = Field(default=None, alias="metadata")

    @field_validator("asset_type")
    @classmethod
    def validate_asset_type(cls, value: str | None) -> str | None:
        if value is not None and value not in ASSET_TYPES:
            raise ValueError("asset_type must be image, video, audio, document, or other")
        return value


class MediaAssetRead(MediaAssetCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: int
    created_at: datetime
    updated_at: datetime


class MediaCollectionCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1)
    description: str | None = None
    created_by_id: int | None = None


class MediaCollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None


class MediaCollectionRead(MediaCollectionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class MediaTranscriptCreate(BaseModel):
    transcript_text: str = Field(min_length=1)
    language: str | None = None
    source: str | None = None


class MediaTranscriptRead(MediaTranscriptCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_id: int
    created_at: datetime


class MediaAnnotationCreate(BaseModel):
    annotation_type: str = Field(min_length=1)
    content: str = Field(min_length=1)
    created_by_id: int | None = None


class MediaAnnotationRead(MediaAnnotationCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_id: int
    created_at: datetime


class MediaProcessingJobCreate(BaseModel):
    job_type: str = Field(min_length=1)
    status: str = "pending"
    result: dict[str, Any] | None = None
    error_message: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in JOB_STATUSES:
            raise ValueError("status must be pending, running, success, or failed")
        return value


class MediaProcessingJobUpdate(BaseModel):
    status: str | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None and value not in JOB_STATUSES:
            raise ValueError("status must be pending, running, success, or failed")
        return value


class MediaProcessingJobRead(MediaProcessingJobCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_id: int
    created_at: datetime
    updated_at: datetime


class MediaTagCreate(BaseModel):
    name: str = Field(min_length=1)


class MediaTagRead(MediaTagCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
