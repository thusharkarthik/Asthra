from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


page_tag_links = Table(
    "page_tag_links",
    Base.metadata,
    Column("page_id", ForeignKey("pages.id"), primary_key=True),
    Column("tag_id", ForeignKey("page_tags.id"), primary_key=True),
)


class PageTag(Base):
    __tablename__ = "page_tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    pages = relationship("Page", secondary=page_tag_links, back_populates="tags")
