from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ImpactScore(Base):
    __tablename__ = "impact_scores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), nullable=False, unique=True)
    impact: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    effort: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    reach: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    total_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    idea = relationship("Idea", back_populates="impact_score_record")
