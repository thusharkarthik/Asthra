from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation_rule import FlowAutomationRule
from app.schemas.automation_rule import FlowAutomationRuleCreate, FlowAutomationRuleUpdate


class AutomationRuleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, rule_create: FlowAutomationRuleCreate) -> FlowAutomationRule:
        rule = FlowAutomationRule(**rule_create.model_dump())
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

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
        statement = select(FlowAutomationRule)
        if workspace_id is not None:
            statement = statement.where(FlowAutomationRule.workspace_id == workspace_id)
        if project_id is not None:
            statement = statement.where(FlowAutomationRule.project_id == project_id)
        if trigger_type:
            statement = statement.where(FlowAutomationRule.trigger_type == trigger_type)
        if is_active is not None:
            statement = statement.where(FlowAutomationRule.is_active.is_(is_active))
        statement = statement.order_by(FlowAutomationRule.id.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def get(self, rule_id: int) -> FlowAutomationRule | None:
        return self.db.get(FlowAutomationRule, rule_id)

    def update(self, rule: FlowAutomationRule, rule_update: FlowAutomationRuleUpdate) -> FlowAutomationRule:
        for field, value in rule_update.model_dump(exclude_unset=True).items():
            setattr(rule, field, value)
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def delete(self, rule: FlowAutomationRule) -> None:
        self.db.delete(rule)
        self.db.commit()
