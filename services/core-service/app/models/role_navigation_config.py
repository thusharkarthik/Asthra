from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class RoleNavigationConfig(TimestampMixin, Base):
    __tablename__ = "role_navigation_configs"
    __table_args__ = (
        UniqueConstraint("role_id", "mode", "nav_key", name="uq_role_navigation_config_role_mode_nav"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    nav_key: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    visibility: Mapped[str] = mapped_column(String(50), default="default", nullable=False)
    order_override: Mapped[int | None] = mapped_column(Integer)
    label_override: Mapped[str | None] = mapped_column(String(255))
    group_override: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    role = relationship("Role")
