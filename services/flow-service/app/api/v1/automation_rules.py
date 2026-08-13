from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.automation_rule import FlowAutomationRule
from app.schemas.automation_rule import (
    FlowAutomationRuleCreate,
    FlowAutomationRuleRead,
    FlowAutomationRuleTestRequest,
    FlowAutomationRuleTestResult,
    FlowAutomationRuleUpdate,
)
from app.services.automation_rule_service import AutomationRuleService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=FlowAutomationRuleRead, status_code=status.HTTP_201_CREATED)
def create_automation_rule(
    rule_create: FlowAutomationRuleCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FlowAutomationRule:
    return AutomationRuleService(db).create(rule_create)


@router.get("", response_model=list[FlowAutomationRuleRead])
def list_automation_rules(
    workspace_id: int | None = None,
    project_id: int | None = None,
    trigger_type: str | None = None,
    is_active: bool | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[FlowAutomationRule]:
    return AutomationRuleService(db).list(
        workspace_id=workspace_id,
        project_id=project_id,
        trigger_type=trigger_type,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )


@router.get("/{rule_id}", response_model=FlowAutomationRuleRead)
def get_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FlowAutomationRule:
    return AutomationRuleService(db).get(rule_id)


@router.patch("/{rule_id}", response_model=FlowAutomationRuleRead)
def update_automation_rule(
    rule_id: int,
    rule_update: FlowAutomationRuleUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FlowAutomationRule:
    return AutomationRuleService(db).update(rule_id, rule_update)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    AutomationRuleService(db).delete(rule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{rule_id}/test", response_model=FlowAutomationRuleTestResult)
def run_automation_rule_test(
    rule_id: int,
    test_request: FlowAutomationRuleTestRequest | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FlowAutomationRuleTestResult:
    return AutomationRuleService(db).test_rule(rule_id, test_request.work_item_id if test_request else None)
