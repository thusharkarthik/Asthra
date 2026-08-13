from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class DiscoverDashboardSummary(Base):
    __tablename__ = "discover_dashboard_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    total_ideas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviewing: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validating: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    approved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    converted_to_work: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
