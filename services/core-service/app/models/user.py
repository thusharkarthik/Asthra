from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(1000))
    job_title: Mapped[str | None] = mapped_column(String(255))
    timezone: Mapped[str | None] = mapped_column(String(100))
    locale: Mapped[str | None] = mapped_column(String(50))
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    organization_memberships = relationship("OrganizationMember", back_populates="user")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user")
    team_memberships = relationship("TeamMember", back_populates="user")
    user_roles = relationship("UserRole", back_populates="user")


class UserRole(TimestampMixin, Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role")


class RoleAssignment(TimestampMixin, Base):
    __tablename__ = "role_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "scope_type", "scope_id", name="uq_role_assignment_scope"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False, index=True)
    scope_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    scope_id: Mapped[int | None] = mapped_column(index=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)
    assigned_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", foreign_keys=[user_id])
    role = relationship("Role")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
