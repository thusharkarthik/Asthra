from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class DiscoverFlowLink(Base):
    __tablename__ = "discover_flow_links"
    __table_args__ = (
        UniqueConstraint("idea_id", "flow_work_item_id", name="uq_discover_flow_link_idea_work_item"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    idea_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    flow_work_item_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    flow_item_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
