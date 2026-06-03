from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class AssistantSession(Base, TimestampMixin):
    __tablename__ = "assistant_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)

    messages = relationship("AssistantMessage", back_populates="session", cascade="all, delete-orphan")
    contexts = relationship("AssistantContext", back_populates="session", cascade="all, delete-orphan")
    tool_calls = relationship("AssistantToolCall", back_populates="session", cascade="all, delete-orphan")
    responses = relationship("AssistantResponse", back_populates="session", cascade="all, delete-orphan")


class AssistantMessage(Base):
    __tablename__ = "assistant_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assistant_sessions.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AssistantSession", back_populates="messages")


class AssistantContext(Base):
    __tablename__ = "assistant_contexts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assistant_sessions.id"), nullable=False, index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("assistant_messages.id"), index=True)
    source_type: Mapped[str | None] = mapped_column(String(100), index=True)
    source_reference: Mapped[str | None] = mapped_column(String(1000), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_score: Mapped[float | None] = mapped_column()
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AssistantSession", back_populates="contexts")


class AssistantToolCall(Base):
    __tablename__ = "assistant_tool_calls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assistant_sessions.id"), nullable=False, index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("assistant_messages.id"), index=True)
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="planned", nullable=False)
    input_: Mapped[dict | None] = mapped_column("input", JSON)
    output_: Mapped[dict | None] = mapped_column("output", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AssistantSession", back_populates="tool_calls")


class AssistantResponse(Base):
    __tablename__ = "assistant_responses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assistant_sessions.id"), nullable=False, index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("assistant_messages.id"), index=True)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(255))
    retrieval_metadata: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AssistantSession", back_populates="responses")
