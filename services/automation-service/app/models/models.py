from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Workflow(Base, TimestampMixin):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False, index=True)
    created_by_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    triggers: Mapped[list["WorkflowTrigger"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    conditions: Mapped[list["WorkflowCondition"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    actions: Mapped[list["WorkflowAction"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    executions: Mapped[list["WorkflowExecution"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    schedules: Mapped[list["ScheduledJob"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    audit_logs: Mapped[list["AutomationAuditLog"]] = relationship(back_populates="workflow")


class WorkflowTrigger(Base, TimestampMixin):
    __tablename__ = "workflow_triggers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    trigger_type: Mapped[str] = mapped_column(String(100), nullable=False)
    trigger_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workflow: Mapped[Workflow] = relationship(back_populates="triggers")


class WorkflowCondition(Base, TimestampMixin):
    __tablename__ = "workflow_conditions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    condition_type: Mapped[str] = mapped_column(String(100), nullable=False)
    condition_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    workflow: Mapped[Workflow] = relationship(back_populates="conditions")


class WorkflowAction(Base, TimestampMixin):
    __tablename__ = "workflow_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    execution_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    workflow: Mapped[Workflow] = relationship(back_populates="actions")


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    execution_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    execution_log: Mapped[str | None] = mapped_column(Text, nullable=True)

    workflow: Mapped[Workflow] = relationship(back_populates="executions")
    audit_logs: Mapped[list["AutomationAuditLog"]] = relationship(back_populates="execution")


class ScheduledJob(Base, TimestampMixin):
    __tablename__ = "scheduled_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id"), nullable=False, index=True)
    cron_expression: Mapped[str | None] = mapped_column(String(100), nullable=True)
    interval_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workflow: Mapped[Workflow] = relationship(back_populates="schedules")


class AutomationAuditLog(Base):
    __tablename__ = "automation_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workflow_id: Mapped[int | None] = mapped_column(ForeignKey("workflows.id"), nullable=True, index=True)
    execution_id: Mapped[int | None] = mapped_column(ForeignKey("workflow_executions.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    workflow: Mapped[Workflow | None] = relationship(back_populates="audit_logs")
    execution: Mapped[WorkflowExecution | None] = relationship(back_populates="audit_logs")
