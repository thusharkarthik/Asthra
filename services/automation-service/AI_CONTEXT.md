# Automation Service Context

## Purpose

Workflow Automation.

## Owned Data

- Rules
- Triggers
- Actions
- Workflow Runs

## Not Owned Data

- Users
- Module business records
- Integration credentials

## APIs

- Automation rule CRUD
- Trigger definitions
- Action definitions
- Workflow run history

## Events Published

- WorkflowTriggered
- WorkflowRunStarted
- WorkflowRunCompleted
- WorkflowRunFailed

## Events Consumed

- Future platform domain events
- Future integration events

## RBAC Rules

- Use Automation permission codes such as `automation.rule.view` and `automation.rule.manage`.
- Automation must not bypass source module permissions.

## UI Screens

- Automation Dashboard
- Rules
- Workflow Runs

## Future Roadmap

- Visual Workflow Builder
- Generated Workflows
- Workflow Marketplace
