from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class DocsDashboardSummary(TimestampMixin, Base):
    __tablename__ = "docs_dashboard_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    total_spaces: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    draft_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
