from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class Invitation(TimestampMixin, Base):
    __tablename__ = "invitations"
    __table_args__ = (
        UniqueConstraint("email", "organization_id", "workspace_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    workspace_id: Mapped[int | None] = mapped_column(ForeignKey("workspaces.id"))
    invited_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"))
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    organization = relationship("Organization")
    workspace = relationship("Workspace")
    invited_by = relationship("User")
    role = relationship("Role")
