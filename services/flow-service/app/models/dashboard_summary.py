from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class FlowDashboardSummary(TimestampMixin, Base):
    __tablename__ = "flow_dashboard_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    open_work_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    in_progress_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_sprints: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_releases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
