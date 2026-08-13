from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class LinkedEntity(TimestampMixin, Base):
    __tablename__ = "linked_entities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_title: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_url: Mapped[str | None] = mapped_column(String(500))

    work_item = relationship("WorkItem", back_populates="linked_entities")
