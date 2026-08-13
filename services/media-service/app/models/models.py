from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


asset_tags = Table(
    "media_asset_tags",
    Base.metadata,
    Column("asset_id", ForeignKey("media_assets.id"), primary_key=True),
    Column("tag_id", ForeignKey("media_tags.id"), primary_key=True),
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class MediaAsset(Base, TimestampMixin):
    __tablename__ = "media_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    uploaded_by_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    transcripts: Mapped[list["MediaTranscript"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    annotations: Mapped[list["MediaAnnotation"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    jobs: Mapped[list["MediaProcessingJob"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    tags: Mapped[list["MediaTag"]] = relationship(secondary=asset_tags, back_populates="assets")


class MediaCollection(Base, TimestampMixin):
    __tablename__ = "media_collections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)


class MediaTranscript(Base):
    __tablename__ = "media_transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("media_assets.id"), nullable=False, index=True)
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    asset: Mapped[MediaAsset] = relationship(back_populates="transcripts")


class MediaAnnotation(Base):
    __tablename__ = "media_annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("media_assets.id"), nullable=False, index=True)
    annotation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    asset: Mapped[MediaAsset] = relationship(back_populates="annotations")


class MediaProcessingJob(Base, TimestampMixin):
    __tablename__ = "media_processing_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("media_assets.id"), nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset: Mapped[MediaAsset] = relationship(back_populates="jobs")


class MediaTag(Base):
    __tablename__ = "media_tags"
    __table_args__ = (UniqueConstraint("name", name="uq_media_tags_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    assets: Mapped[list[MediaAsset]] = relationship(secondary=asset_tags, back_populates="tags")
