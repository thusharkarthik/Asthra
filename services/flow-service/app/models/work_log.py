from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class WorkLog(Base):
    __tablename__ = "work_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(index=True)
    description: Mapped[str | None] = mapped_column(Text)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    work_item = relationship("WorkItem", back_populates="work_logs")
