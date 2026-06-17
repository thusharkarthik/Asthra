from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


work_item_labels = Table(
    "work_item_label_links",
    Base.metadata,
    Column("work_item_id", ForeignKey("work_items.id"), primary_key=True),
    Column("label_id", ForeignKey("work_item_labels.id"), primary_key=True),
)


class WorkItem(TimestampMixin, Base):
    __tablename__ = "work_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(index=True, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("work_items.id"))
    type_id: Mapped[int] = mapped_column(ForeignKey("work_item_types.id"), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey("work_item_statuses.id"), nullable=False)
    priority_id: Mapped[int | None] = mapped_column(ForeignKey("work_item_priorities.id"))
    board_id: Mapped[int | None] = mapped_column(ForeignKey("boards.id"))
    board_column_id: Mapped[int | None] = mapped_column(ForeignKey("board_columns.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    assignee_id: Mapped[int | None] = mapped_column(index=True)
    reporter_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effort_score: Mapped[int | None] = mapped_column(Integer)
    effort_size: Mapped[str | None] = mapped_column(String(10))
    business_value: Mapped[str | None] = mapped_column(String(20))
    risk_level: Mapped[str | None] = mapped_column(String(20))
    complexity: Mapped[str | None] = mapped_column(String(20))
    acceptance_criteria: Mapped[str | None] = mapped_column(Text)
    definition_of_done: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    parent = relationship("WorkItem", remote_side=[id], back_populates="children")
    children = relationship("WorkItem", back_populates="parent")
    type = relationship("WorkItemType", back_populates="work_items")
    status = relationship("WorkItemStatus", back_populates="work_items")
    priority = relationship("WorkItemPriority", back_populates="work_items")
    board = relationship("Board", back_populates="work_items")
    board_column = relationship("BoardColumn", back_populates="work_items")
    comments = relationship(
        "WorkItemComment",
        back_populates="work_item",
        cascade="all, delete-orphan",
    )
    attachments = relationship(
        "WorkItemAttachment",
        back_populates="work_item",
        cascade="all, delete-orphan",
    )
    labels = relationship(
        "WorkItemLabel",
        secondary=work_item_labels,
        back_populates="work_items",
    )
