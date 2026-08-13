# Flow Automation Rules

## Scope

Flow automation rules are project-scoped MVP rules that run when supported Flow events happen.

Supported triggers:

- `work_item_created`
- `status_changed`
- `priority_changed`
- `assignee_changed`
- `comment_added`

Supported conditions:

- status equals
- priority equals
- assignee exists
- risk level equals
- effort size equals

Supported actions:

- create notification
- add comment
- update priority
- update status
- assign user when `assignee_id` is provided

## Frontend

The automation UI is available at:

```text
/flow/automation
```

Users can create rules, enable or disable rules, delete rules, and test a rule against an existing project work item.

## Execution Behavior

Rules execute synchronously and fail safely. If one rule fails, the main Flow action continues. Successful rule execution writes an audit event:

```text
automation_rule.executed
```

Automation-added comments do not recursively trigger another `comment_added` automation run.

## Remaining Gaps

- No background worker or retry queue yet.
- No complex condition builder yet.
- Status and priority name resolution is MVP-friendly and should later use project workflow metadata consistently.
- No cross-service automation actions yet.
