from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class WorkItemRelation(TimestampMixin, Base):
    __tablename__ = "work_item_relations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False, index=True)
    target_work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False, index=True)
    relation_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[int | None] = mapped_column(index=True)

    source_work_item = relationship("WorkItem", foreign_keys=[source_work_item_id])
    target_work_item = relationship("WorkItem", foreign_keys=[target_work_item_id])

    @property
    def target_title(self) -> str | None:
        return self.target_work_item.title if self.target_work_item else None

    @property
    def target_status_id(self) -> int | None:
        return self.target_work_item.status_id if self.target_work_item else None

    @property
    def target_priority_id(self) -> int | None:
        return self.target_work_item.priority_id if self.target_work_item else None
