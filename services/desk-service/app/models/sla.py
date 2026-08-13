from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class SLA(Base):
    __tablename__ = "slas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    response_time_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    resolution_time_minutes: Mapped[int] = mapped_column(Integer, default=1440, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
