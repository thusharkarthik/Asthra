from sqlalchemy import Boolean, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class SavedView(TimestampMixin, Base):
    __tablename__ = "saved_views"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int | None] = mapped_column(Integer, index=True)
    project_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    filters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
