from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class DeskDashboardSummary(Base):
    __tablename__ = "desk_dashboard_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    open_tickets: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assigned_tickets: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    in_progress_tickets: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    resolved_tickets: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
