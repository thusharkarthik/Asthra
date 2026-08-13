from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class IdeaAIAnalysis(Base):
    __tablename__ = "idea_ai_analyses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text)
    problem_clarity: Mapped[str | None] = mapped_column(Text)
    target_users: Mapped[str | None] = mapped_column(Text)
    feasibility: Mapped[str | None] = mapped_column(Text)
    risks: Mapped[str | None] = mapped_column(Text)
    mvp_suggestion: Mapped[str | None] = mapped_column(Text)
    monetization_angle: Mapped[str | None] = mapped_column(Text)
    next_steps: Mapped[str | None] = mapped_column(Text)
    raw_response: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    idea = relationship("Idea")
