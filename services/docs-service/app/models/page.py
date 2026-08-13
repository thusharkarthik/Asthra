from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class Page(TimestampMixin, Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id"), nullable=False)
    parent_page_id: Mapped[int | None] = mapped_column(ForeignKey("pages.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    created_by_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    updated_by_id: Mapped[int | None] = mapped_column(Integer, index=True)
    discover_idea_id: Mapped[int | None] = mapped_column(Integer, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    space = relationship("Space", back_populates="pages")
    parent = relationship("Page", remote_side=[id], back_populates="children")
    children = relationship("Page", back_populates="parent")
    versions = relationship("PageVersion", back_populates="page", cascade="all, delete-orphan")
    comments = relationship("PageComment", back_populates="page", cascade="all, delete-orphan")
    attachments = relationship(
        "PageAttachment",
        back_populates="page",
        cascade="all, delete-orphan",
    )
    tags = relationship("PageTag", secondary="page_tag_links", back_populates="pages")
