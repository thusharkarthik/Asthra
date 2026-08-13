from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ValidationNote(Base):
    __tablename__ = "validation_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), nullable=False, index=True)
    note_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    idea = relationship("Idea", back_populates="validation_notes")
