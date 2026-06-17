from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.mixins import TimestampMixin
from app.models.work_item_status import WorkItemStatus as WorkflowStatus


class Workflow(TimestampMixin, Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    workspace_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    statuses = relationship("WorkItemStatus", back_populates="workflow", cascade="all, delete-orphan")
    transitions = relationship("WorkflowTransition", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowTransition(TimestampMixin, Base):
    __tablename__ = "workflow_transitions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    from_status_id: Mapped[int] = mapped_column(ForeignKey("work_item_statuses.id"), nullable=False)
    to_status_id: Mapped[int] = mapped_column(ForeignKey("work_item_statuses.id"), nullable=False)

    workflow = relationship("Workflow", back_populates="transitions")
    from_status = relationship("WorkItemStatus", foreign_keys=[from_status_id])
    to_status = relationship("WorkItemStatus", foreign_keys=[to_status_id])
