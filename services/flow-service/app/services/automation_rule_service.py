from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.automation_rule import FlowAutomationRule
from app.models.work_item import WorkItem
from app.repositories.automation_rule_repository import AutomationRuleRepository
from app.repositories.work_item_repository import WorkItemRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.automation_rule import (
    ALLOWED_AUTOMATION_ACTIONS,
    FlowAutomationRuleCreate,
    FlowAutomationRuleTestResult,
    FlowAutomationRuleUpdate,
)
from app.schemas.comment import WorkItemCommentCreate
from app.schemas.work_item import WorkItemUpdate
from app.services.audit_service import AuditService
from app.services.comment_service import CommentService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AutomationRuleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.rule_repository = AutomationRuleRepository(db)
        self.work_item_repository = WorkItemRepository(db)
        self.audit_service = AuditService(db)
        self.notification_service = NotificationService(db)

    def create(self, rule_create: FlowAutomationRuleCreate) -> FlowAutomationRule:
        self._validate_action_config(rule_create.action_config)
        return self.rule_repository.create(rule_create)

    def list(
        self,
        *,
        workspace_id: int | None = None,
        project_id: int | None = None,
        trigger_type: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[FlowAutomationRule]:
        return self.rule_repository.list(
            workspace_id=workspace_id,
            project_id=project_id,
            trigger_type=trigger_type,
            is_active=is_active,
            limit=limit,
            offset=offset,
        )

    def get(self, rule_id: int) -> FlowAutomationRule:
        rule = self.rule_repository.get(rule_id)
        if rule is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation rule not found.")
        return rule

    def update(self, rule_id: int, rule_update: FlowAutomationRuleUpdate) -> FlowAutomationRule:
        self._validate_action_config(rule_update.action_config)
        return self.rule_repository.update(self.get(rule_id), rule_update)

    def delete(self, rule_id: int) -> None:
        self.rule_repository.delete(self.get(rule_id))

    def test_rule(self, rule_id: int, work_item_id: int | None = None) -> FlowAutomationRuleTestResult:
        rule = self.get(rule_id)
        work_item = self._resolve_test_work_item(rule, work_item_id)
        if work_item is None:
            return FlowAutomationRuleTestResult(rule_id=rule.id, matched=False, executed=False, message="No work item available to test.")
        matched = self._conditions_match(rule, work_item)
        if not matched:
            return FlowAutomationRuleTestResult(rule_id=rule.id, matched=False, executed=False, message="Rule conditions did not match.")
        executed = self._execute_action(rule, work_item, event_payload={"test": True})
        return FlowAutomationRuleTestResult(rule_id=rule.id, matched=True, executed=executed, message="Rule test executed." if executed else "Rule action did not execute.")

    def execute_for_event(self, trigger_type: str, work_item: WorkItem, event_payload: dict[str, Any] | None = None) -> None:
        rules = self.rule_repository.list(project_id=work_item.project_id, trigger_type=trigger_type, is_active=True, limit=100)
        for rule in rules:
            try:
                if self._conditions_match(rule, work_item):
                    self._execute_action(rule, work_item, event_payload=event_payload or {})
            except Exception:
                logger.exception("flow.automation_rule.execution_failed", extra={"rule_id": rule.id, "work_item_id": work_item.id})

    def _resolve_test_work_item(self, rule: FlowAutomationRule, work_item_id: int | None) -> WorkItem | None:
        if work_item_id is not None:
            work_item = self.work_item_repository.get_by_id(work_item_id)
            if work_item is None or not work_item.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item not found.")
            return work_item
        candidates = self.work_item_repository.list(project_id=rule.project_id, limit=1)
        return candidates[0] if candidates else None

    def _conditions_match(self, rule: FlowAutomationRule, work_item: WorkItem) -> bool:
        config = rule.condition_config or {}
        conditions = config.get("conditions")
        if not conditions:
            conditions = [config] if config else []
        return all(self._condition_matches(condition, work_item) for condition in conditions if condition)

    def _condition_matches(self, condition: dict[str, Any], work_item: WorkItem) -> bool:
        condition_type = condition.get("type")
        if condition_type == "status_equals":
            expected = condition.get("status_id")
            if expected is None:
                expected = self.work_item_repository.get_or_create_status_by_name(str(condition.get("status") or "")).id
            return work_item.status_id == int(expected)
        if condition_type == "priority_equals":
            expected = condition.get("priority_id")
            if expected is None:
                expected = self.work_item_repository.get_or_create_priority_by_name(str(condition.get("priority") or "")).id
            return work_item.priority_id == int(expected)
        if condition_type == "assignee_exists":
            return work_item.assignee_id is not None
        if condition_type == "risk_level_equals":
            return work_item.risk_level == condition.get("risk_level")
        if condition_type == "effort_size_equals":
            expected = condition.get("effort_size")
            return work_item.effort_size == (str(expected).upper() if expected is not None else expected)
        return True

    def _execute_action(self, rule: FlowAutomationRule, work_item: WorkItem, event_payload: dict[str, Any]) -> bool:
        action_config = rule.action_config or {}
        action_type = action_config.get("type")
        if action_type not in ALLOWED_AUTOMATION_ACTIONS:
            return False
        if action_type == "create_notification":
            self.notification_service.create_for_work_item(
                work_item=work_item,
                notification_type="automation_rule",
                title=action_config.get("title") or f"Automation: {rule.name}",
                message=action_config.get("message") or f"Rule '{rule.name}' ran for '{work_item.title}'.",
                user_id=action_config.get("user_id") or work_item.assignee_id,
                workspace_id=rule.workspace_id,
            )
        elif action_type == "add_comment":
            CommentService(self.db).create(
                work_item.id,
                WorkItemCommentCreate(author_user_id=action_config.get("actor_id") or 0, body=action_config.get("body") or f"Automation rule '{rule.name}' ran."),
                run_automation=False,
            )
        elif action_type == "update_priority":
            priority_id = action_config.get("priority_id")
            if priority_id is None:
                priority_id = self.work_item_repository.get_or_create_priority_by_name(action_config.get("priority") or "medium").id
            self.work_item_repository.update(work_item, WorkItemUpdate(priority_id=int(priority_id)))
        elif action_type == "update_status":
            status_id = action_config.get("status_id")
            if status_id is None:
                status_id = self.work_item_repository.get_or_create_status_by_name(action_config.get("status") or "todo").id
            self.work_item_repository.update(work_item, WorkItemUpdate(status_id=int(status_id)))
        elif action_type == "assign_user":
            assignee_id = action_config.get("assignee_id")
            if assignee_id is None:
                return False
            self.work_item_repository.update(work_item, WorkItemUpdate(assignee_id=int(assignee_id)))
        self._record_execution_audit(rule, work_item, action_type, event_payload)
        return True

    def _record_execution_audit(self, rule: FlowAutomationRule, work_item: WorkItem, action_type: str, event_payload: dict[str, Any]) -> None:
        self.audit_service.record(
            AuditEventCreate(
                workspace_id=rule.workspace_id,
                project_id=rule.project_id,
                work_item_id=work_item.id,
                entity_type="automation_rule",
                entity_id=str(rule.id),
                action="automation_rule.executed",
                new_value=action_type,
                metadata={"rule_name": rule.name, "trigger_type": rule.trigger_type, "event_payload": event_payload},
            )
        )

    def _validate_action_config(self, action_config: dict | None) -> None:
        if not action_config:
            return
        action_type = action_config.get("type")
        if action_type not in ALLOWED_AUTOMATION_ACTIONS:
            allowed = ", ".join(sorted(ALLOWED_AUTOMATION_ACTIONS))
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"action_config.type must be one of: {allowed}.")
