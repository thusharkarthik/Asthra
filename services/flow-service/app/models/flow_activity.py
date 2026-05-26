from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class FlowActivity(TimestampMixin, Base):
    __tablename__ = "flow_activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(Integer, index=True)
    project_id: Mapped[int | None] = mapped_column(Integer, index=True)
    work_item_id: Mapped[int | None] = mapped_column(Integer, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSON)
