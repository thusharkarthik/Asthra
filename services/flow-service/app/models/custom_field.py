from sqlalchemy import Boolean, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class CustomFieldDefinition(TimestampMixin, Base):
    __tablename__ = "custom_field_definitions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[str] = mapped_column(String(30), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    options: Mapped[list[str] | None] = mapped_column(JSON)

    values = relationship(
        "CustomFieldValue",
        back_populates="definition",
        cascade="all, delete-orphan",
    )


class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"), nullable=False, index=True)
    custom_field_id: Mapped[int] = mapped_column(ForeignKey("custom_field_definitions.id"), nullable=False, index=True)
    value: Mapped[str | None] = mapped_column(Text)

    work_item = relationship("WorkItem", back_populates="custom_field_values")
    definition = relationship("CustomFieldDefinition", back_populates="values")
