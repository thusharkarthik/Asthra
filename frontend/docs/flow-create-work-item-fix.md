# Flow Create Work Item Fix

## Root Cause

The frontend was sending hard-coded `type_id`, `status_id`, and `priority_id` values when creating Flow work items. It also sent nullable fields that the user should not need to understand during basic creation.

On a fresh local SQLite database those lookup rows may not exist, so `flow-service` could return validation or reference errors such as `422 Unprocessable Entity` or `Work item status not found.` The route was available, but the payload contract was too strict for the MVP UI.

## Endpoint Contract

Frontend route through API Gateway:

`POST /api/flow/api/v1/work-items`

Gateway forwards to Flow service:

`POST /api/v1/work-items`

Minimum payload:

```json
{
  "project_id": 3,
  "title": "Create onboarding checklist"
}
```

Optional fields:

```json
{
  "description": "Document the setup flow",
  "assignee_id": 12,
  "due_date": "2026-06-30T00:00:00Z"
}
```

Flow service now applies MVP defaults when missing:

- `type_id`: default `task`
- `status_id`: default `todo`
- `priority_id`: default `medium`
- `reporter_id`: temporary MVP fallback `0` until Core auth context is enforced

The frontend create dialog submits only:

- `project_id`
- `title`
- `description` when present
- `assignee_id` only when entered

It does not submit status labels, priority labels, lookup IDs, or `reporter_id`.

## Manual Test Steps

1. Login.
2. Select an organization.
3. Select a workspace.
4. Select a project.
5. Go to Flow.
6. Click Create Work Item.
7. Enter title and description.
8. Leave assignee empty.
9. Submit.
10. Confirm the item appears in Recent Work Items.
11. Confirm the item appears in the Work Items list.
12. Open the item detail page.

## Expected Result

Work item creation should not return `422` for missing type/status/priority/reporter fields and should not return `404` for missing type/status/priority lookup rows. Any remaining backend validation error should show the specific field details in the create dialog.
