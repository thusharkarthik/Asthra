from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    context_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    access_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    settings: Mapped[dict | None] = mapped_column(JSON)

    created_by = relationship("User")
    members = relationship("OrganizationMember", back_populates="organization")
    workspaces = relationship("Workspace", back_populates="organization")
    roles = relationship("Role", back_populates="organization")


class OrganizationMember(TimestampMixin, Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"))
    member_role: Mapped[str] = mapped_column(String(50), default="member", nullable=False)

    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organization_memberships")
    role = relationship("Role")
