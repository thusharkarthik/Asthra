from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class TeamCapacity(TimestampMixin, Base):
    __tablename__ = "team_capacities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(index=True)
    team_id: Mapped[int | None] = mapped_column(index=True)
    sprint_id: Mapped[int | None] = mapped_column(ForeignKey("sprints.id"), index=True)
    capacity_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    sprint = relationship("Sprint")
