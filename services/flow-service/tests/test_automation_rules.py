from app.api.v1.automation_rules import create_automation_rule, list_automation_rules, run_automation_rule_test, update_automation_rule
from app.models.flow_notification import FlowNotification
from app.schemas.automation_rule import (
    FlowAutomationRuleCreate,
    FlowAutomationRuleTestRequest,
    FlowAutomationRuleUpdate,
)
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate
from app.services.audit_service import AuditService
from app.services.automation_rule_service import AutomationRuleService
from app.services.work_item_service import WorkItemService


def test_automation_rule_crud_routes(db):
    created = create_automation_rule(
        FlowAutomationRuleCreate(
            project_id=42,
            name="Notify on status",
            trigger_type="status_changed",
            condition_config={"type": "assignee_exists"},
            action_config={"type": "create_notification", "title": "Moved"},
        ),
        db=db,
    )

    assert created.id is not None
    assert created.name == "Notify on status"

    listed = list_automation_rules(project_id=42, limit=50, offset=0, db=db)
    assert [rule.id for rule in listed] == [created.id]

    updated = update_automation_rule(created.id, FlowAutomationRuleUpdate(is_active=False), db=db)
    assert updated.is_active is False


def test_status_change_rule_creates_notification_and_audit_event(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item_service = WorkItemService(db)
    work_item = work_item_service.create(WorkItemCreate(project_id=42, title="Automate status", assignee_id=7))
    target_status = work_item_service.work_item_repository.get_or_create_status_by_name("in_progress")

    AutomationRuleService(db).create(
        FlowAutomationRuleCreate(
            project_id=42,
            name="Notify assigned owner when status changes",
            trigger_type="status_changed",
            condition_config={"type": "status_equals", "status_id": target_status.id},
            action_config={"type": "create_notification", "title": "Status moved", "message": "Work changed status."},
        )
    )

    work_item_service.update(work_item.id, WorkItemUpdate(status_id=target_status.id))

    notifications = db.query(FlowNotification).filter(FlowNotification.notification_type == "automation_rule").all()
    assert len(notifications) == 1
    assert notifications[0].user_id == 7
    assert notifications[0].title == "Status moved"

    audit_events = AuditService(db).list(action="automation_rule.executed", limit=50)
    assert len(audit_events) == 1
    assert audit_events[0].entity_type == "automation_rule"
    assert audit_events[0].new_value == "create_notification"


def test_automation_rule_can_add_comment_and_test_rule(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Automation test", risk_level="high"))
    rule = AutomationRuleService(db).create(
        FlowAutomationRuleCreate(
            project_id=42,
            name="Comment on high risk",
            trigger_type="work_item_created",
            condition_config={"type": "risk_level_equals", "risk_level": "high"},
            action_config={"type": "add_comment", "body": "Automation noticed high risk."},
        )
    )

    result = run_automation_rule_test(rule.id, FlowAutomationRuleTestRequest(work_item_id=work_item.id), db=db)

    assert result.matched is True
    assert result.executed is True
    comments = [comment.body for comment in work_item.comments]
    assert "Automation noticed high risk." in comments
    assert AuditService(db).list(action="automation_rule.executed", limit=50)
