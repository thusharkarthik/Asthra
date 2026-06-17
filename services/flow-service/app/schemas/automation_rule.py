from datetime import datetime

from pydantic import BaseModel, Field, field_validator


ALLOWED_AUTOMATION_TRIGGERS = {
    "work_item_created",
    "status_changed",
    "priority_changed",
    "assignee_changed",
    "comment_added",
}

ALLOWED_AUTOMATION_ACTIONS = {
    "create_notification",
    "add_comment",
    "update_priority",
    "update_status",
    "assign_user",
}


class FlowAutomationRuleCreate(BaseModel):
    workspace_id: int | None = None
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    trigger_type: str
    condition_config: dict | None = None
    action_config: dict | None = None
    is_active: bool = True

    @field_validator("trigger_type")
    @classmethod
    def validate_trigger_type(cls, value: str) -> str:
        if value not in ALLOWED_AUTOMATION_TRIGGERS:
            allowed = ", ".join(sorted(ALLOWED_AUTOMATION_TRIGGERS))
            raise ValueError(f"trigger_type must be one of: {allowed}")
        return value


class FlowAutomationRuleUpdate(BaseModel):
    workspace_id: int | None = None
    project_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    trigger_type: str | None = None
    condition_config: dict | None = None
    action_config: dict | None = None
    is_active: bool | None = None

    @field_validator("trigger_type")
    @classmethod
    def validate_trigger_type(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_AUTOMATION_TRIGGERS:
            allowed = ", ".join(sorted(ALLOWED_AUTOMATION_TRIGGERS))
            raise ValueError(f"trigger_type must be one of: {allowed}")
        return value


class FlowAutomationRuleRead(BaseModel):
    id: int
    workspace_id: int | None = None
    project_id: int
    name: str
    description: str | None = None
    trigger_type: str
    condition_config: dict | None = None
    action_config: dict | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FlowAutomationRuleTestRequest(BaseModel):
    work_item_id: int | None = None


class FlowAutomationRuleTestResult(BaseModel):
    rule_id: int
    matched: bool
    executed: bool
    message: str
