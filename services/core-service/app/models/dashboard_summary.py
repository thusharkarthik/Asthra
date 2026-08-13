from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class WorkspaceSummary(TimestampMixin, Base):
    __tablename__ = "workspace_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    workspace_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    project_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    team_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ProjectSummary(TimestampMixin, Base):
    __tablename__ = "project_summary"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    project_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    team_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
