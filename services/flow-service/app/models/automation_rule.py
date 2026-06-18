from sqlalchemy import Boolean, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.mixins import TimestampMixin


class FlowAutomationRule(TimestampMixin, Base):
    __tablename__ = "flow_automation_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int | None] = mapped_column(Integer, index=True)
    project_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    trigger_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    condition_config: Mapped[dict | None] = mapped_column(JSON)
    action_config: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
