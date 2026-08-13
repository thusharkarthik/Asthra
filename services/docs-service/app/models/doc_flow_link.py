from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class DocFlowLink(Base):
    __tablename__ = "doc_flow_links"
    __table_args__ = (
        UniqueConstraint("docs_page_id", "flow_work_item_id", name="uq_doc_flow_link_page_work_item"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    docs_page_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    flow_work_item_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    flow_item_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str | None] = mapped_column(String(50))
    assignee_id: Mapped[int | None] = mapped_column(Integer, index=True)
    priority_id: Mapped[int | None] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
