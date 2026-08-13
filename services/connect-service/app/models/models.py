from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Integration(Base, TimestampMixin):
    __tablename__ = "integrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="inactive", nullable=False, index=True)
    configuration: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    connectors: Mapped[list["Connector"]] = relationship(back_populates="integration", cascade="all, delete-orphan")
    sync_jobs: Mapped[list["SyncJob"]] = relationship(back_populates="integration", cascade="all, delete-orphan")


class Connector(Base, TimestampMixin):
    __tablename__ = "connectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    integration_id: Mapped[int] = mapped_column(ForeignKey("integrations.id"), nullable=False, index=True)
    connector_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    connector_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="inactive", nullable=False, index=True)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    integration: Mapped[Integration] = relationship(back_populates="connectors")


class WebhookEndpoint(Base, TimestampMixin):
    __tablename__ = "webhook_endpoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    deliveries: Mapped[list["WebhookDelivery"]] = relationship(back_populates="webhook_endpoint", cascade="all, delete-orphan")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    webhook_endpoint_id: Mapped[int] = mapped_column(ForeignKey("webhook_endpoints.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    delivery_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    response_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    webhook_endpoint: Mapped[WebhookEndpoint] = relationship(back_populates="deliveries")


class EventSubscription(Base):
    __tablename__ = "event_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subscriber_type: Mapped[str] = mapped_column(String(100), nullable=False)
    subscriber_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    integration_id: Mapped[int] = mapped_column(ForeignKey("integrations.id"), nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    execution_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    integration: Mapped[Integration] = relationship(back_populates="sync_jobs")


class APIConnection(Base, TimestampMixin):
    __tablename__ = "api_connections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    base_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    auth_type: Mapped[str] = mapped_column(String(100), nullable=False)
    connection_status: Mapped[str] = mapped_column(String(50), default="disconnected", nullable=False, index=True)
