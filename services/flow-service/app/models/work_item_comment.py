from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class WorkItemComment(TimestampMixin, Base):
    __tablename__ = "work_item_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False)
    author_user_id: Mapped[int] = mapped_column(index=True, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    work_item = relationship("WorkItem", back_populates="comments")

    @property
    def user_id(self) -> int:
        return self.author_user_id

    @property
    def content(self) -> str:
        return self.body
