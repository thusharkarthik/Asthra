from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class MVPPlan(Base):
    __tablename__ = "mvp_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), nullable=False, unique=True)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    assumptions: Mapped[str | None] = mapped_column(Text)
    risks: Mapped[str | None] = mapped_column(Text)
    success_metrics: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    idea = relationship("Idea", back_populates="mvp_plan")
