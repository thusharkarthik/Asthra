from sqlalchemy import Boolean, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class ModuleRegistry(TimestampMixin, Base):
    __tablename__ = "module_registry"
    __table_args__ = (UniqueConstraint("module_key"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    module_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), default="general", nullable=False, index=True)
    route: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)
    navigation_mode: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    required_feature_flag: Mapped[str | None] = mapped_column(String(150))
    required_permissions: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=1000, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
