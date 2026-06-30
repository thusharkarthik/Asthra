from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class FeatureFlag(TimestampMixin, Base):
    __tablename__ = "feature_flags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    flag_key: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), default="general", nullable=False, index=True)
    default_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    overrides = relationship("FeatureFlagOverride", back_populates="feature_flag")


class FeatureFlagOverride(TimestampMixin, Base):
    __tablename__ = "feature_flag_overrides"
    __table_args__ = (
        UniqueConstraint("flag_key", "scope_type", "scope_id", name="uq_feature_flag_override_scope"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    flag_key: Mapped[str] = mapped_column(ForeignKey("feature_flags.flag_key"), nullable=False, index=True)
    scope_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    scope_id: Mapped[int | None] = mapped_column(index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    feature_flag = relationship("FeatureFlag", back_populates="overrides")
