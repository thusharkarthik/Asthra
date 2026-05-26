from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class Board(TimestampMixin, Base):
    __tablename__ = "boards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    columns = relationship(
        "BoardColumn",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="BoardColumn.sort_order",
    )
    work_items = relationship("WorkItem", back_populates="board")


class BoardColumn(TimestampMixin, Base):
    __tablename__ = "board_columns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id"), nullable=False)
    status_id: Mapped[int | None] = mapped_column(ForeignKey("work_item_statuses.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    work_in_progress_limit: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    board = relationship("Board", back_populates="columns")
    status = relationship("WorkItemStatus", back_populates="board_columns")
    work_items = relationship("WorkItem", back_populates="board_column")
