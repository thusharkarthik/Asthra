# Flow Operational Workflow

## Supported UI Workflow

Flow now supports the core work item lifecycle from the frontend:

1. Create a work item with a selected project, title, and optional description.
2. Open the work item detail page.
3. Edit title, description, status, priority, assignee, and due date.
4. Add comments without manually entering an author ID.
5. Move work items between Todo, In Progress, Review, and Done from the board.
6. Change status directly from the work items list.
7. Archive a work item from the detail page after confirmation.

## Backend Compatibility

The Flow backend accepts minimal create payloads and applies MVP defaults:

- `type_id`: default `task`
- `status_id`: default `todo`
- `priority_id`: default `medium`
- `reporter_id`: temporary system fallback `0`

For updates, the frontend sends stable names where possible:

```json
{
  "status_name": "in_progress",
  "priority_name": "high"
}
```

The backend resolves or creates matching lookup rows before saving.

## Comments

The UI submits comments as:

```json
{
  "content": "Comment text",
  "user_id": 1
}
```

Flow also accepts `body` and `author_user_id` for backend-native clients. If no author is supplied, the service uses a temporary system fallback.

## Remaining Gaps

- Assignee selection is still an optional user ID field until workspace member lookup is wired in.
- Activity is partially backend-backed and partially timestamp-derived in the UI.
- Board movement uses a status dropdown, not drag-and-drop.
- Archive is implemented as soft delete; restore is not available yet.
- Project metadata uses the selected frontend project list and falls back to secondary ID text.
