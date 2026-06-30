from sqlalchemy import Boolean, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class ConfigurationDefinition(TimestampMixin, Base):
    __tablename__ = "configuration_definitions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    config_key: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), default="general", nullable=False, index=True)
    source_module: Mapped[str] = mapped_column(String(100), default="core", nullable=False, index=True)
    value_type: Mapped[str] = mapped_column(String(50), nullable=False)
    default_value: Mapped[object | None] = mapped_column(JSON)
    allowed_values: Mapped[list | None] = mapped_column(JSON)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_inheritance: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    values = relationship("ConfigurationValue", back_populates="definition")


class ConfigurationValue(TimestampMixin, Base):
    __tablename__ = "configuration_values"
    __table_args__ = (
        UniqueConstraint("config_key", "scope_type", "scope_id", name="uq_configuration_value_scope"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    config_key: Mapped[str] = mapped_column(ForeignKey("configuration_definitions.config_key"), nullable=False, index=True)
    scope_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    scope_id: Mapped[int | None] = mapped_column(index=True)
    value: Mapped[object | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    definition = relationship("ConfigurationDefinition", back_populates="values")
