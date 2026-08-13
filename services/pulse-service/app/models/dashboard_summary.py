from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class PulseDashboardSummary(Base):
    __tablename__ = "pulse_dashboard_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    active_incidents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sev1_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sev2_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    resolved_incidents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
