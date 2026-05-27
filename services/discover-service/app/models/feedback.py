from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    idea_id: Mapped[int | None] = mapped_column(ForeignKey("ideas.id"), index=True)
    feature_request_id: Mapped[int | None] = mapped_column(ForeignKey("feature_requests.id"), index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    author: Mapped[str | None] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    idea = relationship("Idea", back_populates="feedback")
    feature_request = relationship("FeatureRequest", back_populates="feedback")
