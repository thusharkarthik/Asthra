# Asthra Flow Service

Asthra Flow is the work management service for Asthra. This foundation is limited to the Tier 2 service skeleton, database setup, initial work-management models, schemas, and placeholder API routers.

This service does not implement frontend functionality, AI, RAG, agents, automation, integrations, analytics, or advanced reporting.

## Scope

Initial Flow entities:

- Work items for tasks, issues, epics, stories, and subtasks
- Work item types, statuses, and priorities
- Work item comments
- Work item labels
- Work item attachment metadata
- Flow activity events for core MVP changes
- Boards and board columns

Flow references Asthra Core records by ID for users, workspaces, and projects. Cross-service validation and synchronization will be added later through service contracts, not direct database foreign keys.

## Setup

```bash
cd services/flow-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Health endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

API routes are mounted under `/api/v1`.

Seed default Flow lookup data after the database tables exist:

```bash
python scripts/seed_flow_defaults.py
```

The seed script is idempotent and creates or updates:

- types: `task`, `bug`, `story`, `epic`
- statuses: `todo`, `in_progress`, `review`, `done`
- priorities: `low`, `medium`, `high`, `critical`

## Docker

From the repository root:

```bash
docker compose up --build flow-service
```

The Docker Compose service exposes Flow on:

```text
http://localhost:8001
```

The container uses SQLite at `/app/data/asthra_flow.db`, backed by the `flow_service_data` Docker volume.

## Environment Variables

```text
APP_NAME=asthra-flow-service
APP_VERSION=0.1.0
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite:///./asthra_flow.db
```

## Current Structure

```text
app/
  api/v1/          Versioned routers.
  core/            Configuration.
  db/              SQLAlchemy base and session.
  models/          Initial Flow SQLAlchemy models.
  repositories/    Data access logic.
  schemas/         Pydantic request and response schemas.
  services/        Business logic.
  utils/           Reserved for shared helpers.
tests/             Flow service tests.
```

## Planned API Areas

Routers are registered for these areas:

- `/api/v1/work-items`
- `/api/v1/boards`
- `/api/v1/labels`
- `/api/v1/work-items/{work_item_id}/comments`
- `/api/v1/work-items/{work_item_id}/labels`
- `/api/v1/work-items/{work_item_id}/attachments`

## Work Item Endpoints

Work item CRUD is available under `/api/v1/work-items`.

Authentication is currently represented by a TODO placeholder. Core Service JWT validation and project/workspace membership checks will be added when service-to-service auth contracts are ready.

### Create Work Item

```http
POST /api/v1/work-items
```

Request:

```json
{
  "project_id": 1,
  "title": "Design task model",
  "description": "Draft the first task model for Flow",
  "effort_size": "M",
  "effort_score": 5,
  "business_value": "high",
  "risk_level": "medium",
  "complexity": "medium",
  "acceptance_criteria": "The model supports basic execution tracking.",
  "definition_of_done": "Tests pass and docs are updated."
}
```

Only `project_id` and `title` are required. If `type_id`, `status_id`, or `priority_id` are omitted, Flow creates or reuses the MVP defaults `task`, `todo`, and `medium`. If `reporter_id` is omitted, Flow uses a temporary MVP reporter fallback until Core auth context is wired into this service.

### List Work Items

```http
GET /api/v1/work-items
```

Optional query parameters:

- `status_id`
- `assignee_id`
- `project_id`
- `priority_id`
- `limit`
- `offset`

### Update Work Item

```http
PATCH /api/v1/work-items/{work_item_id}
```

The update endpoint accepts lookup IDs or stable lookup names for operational UI flows:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status_name": "in_progress",
  "priority_name": "high",
  "assignee_id": null,
  "due_date": null
}
```

Supported status names include `todo`, `in_progress`, `review`, and `done`. Supported priority names include `low`, `medium`, `high`, and `critical`.

Advanced work item fields:

- `effort_score`: positive integer
- `effort_size`: `XS`, `S`, `M`, `L`, `XL`
- `business_value`: `low`, `medium`, `high`, `critical`
- `risk_level`: `low`, `medium`, `high`
- `complexity`: `low`, `medium`, `high`
- `acceptance_criteria`: optional text
- `definition_of_done`: optional text
- `parent_id`: optional Parent Work reference

For local SQLite development, Flow adds missing nullable advanced columns at startup. If a local database has unexpected schema drift, reset the Flow Docker volume after backing up any data you need.

### Comments

```http
POST /api/v1/work-items/{work_item_id}/comments
```

Flow accepts backend-native and UI-friendly comment payloads:

```json
{
  "content": "This needs a follow-up",
  "user_id": 1
}
```

If no author is supplied, Flow uses a temporary MVP system fallback until Core auth propagation is wired in.

### Get Work Item

```http
GET /api/v1/work-items/{work_item_id}
```

### Update Work Item

```http
PATCH /api/v1/work-items/{work_item_id}
```

### Delete Work Item

```http
DELETE /api/v1/work-items/{work_item_id}
```

Delete performs a soft delete by setting `is_active` to `false`.

Board, comment, label, attachment metadata, and Flow activity event handling are implemented at a basic MVP level. Authentication integration and persistence migrations will be added in later controlled tasks.

## Board Endpoints

### Create Board

```http
POST /api/v1/boards
```

Request:

```json
{
  "project_id": 1,
  "name": "Delivery Board",
  "description": "Basic Kanban board"
}
```

### List Boards

```http
GET /api/v1/boards
```

Optional query parameter:

- `project_id`

### Get Board

```http
GET /api/v1/boards/{board_id}
```

### Create Board Column

```http
POST /api/v1/boards/{board_id}/columns
```

Request:

```json
{
  "status_id": 1,
  "name": "To Do",
  "sort_order": 0,
  "work_in_progress_limit": null
}
```

### List Board Columns

```http
GET /api/v1/boards/{board_id}/columns
```

## Comment Endpoints

### Add Work Item Comment

```http
POST /api/v1/work-items/{work_item_id}/comments
```

Request:

```json
{
  "author_user_id": 1,
  "body": "Initial implementation note"
}
```

### List Work Item Comments

```http
GET /api/v1/work-items/{work_item_id}/comments
```

## Label Endpoints

### Create Label

```http
POST /api/v1/labels
```

Request:

```json
{
  "project_id": 1,
  "name": "Backend",
  "color": "#2563eb"
}
```

Labels are unique per project by case-insensitive name.

### List Labels

```http
GET /api/v1/labels
```

Optional query parameter:

- `project_id`

### Add Label To Work Item

```http
POST /api/v1/work-items/{work_item_id}/labels
```

Request:

```json
{
  "label_id": 1
}
```

The label must belong to the same project as the work item.

## Attachment Endpoints

Attachments store metadata only. Flow does not upload files, store file bytes, or integrate with external storage yet.

### Add Attachment Metadata

```http
POST /api/v1/work-items/{work_item_id}/attachments
```

Request:

```json
{
  "file_name": "spec.pdf",
  "file_url": "https://files.example/spec.pdf",
  "file_type": "application/pdf",
  "file_size": 2048,
  "uploaded_by_id": 1
}
```

### List Work Item Attachments

```http
GET /api/v1/work-items/{work_item_id}/attachments
```

### Delete Attachment Metadata

```http
DELETE /api/v1/work-items/{work_item_id}/attachments/{attachment_id}
```

Delete performs a soft delete by setting `is_active` to `false`.

## Flow Activity Events

Flow writes simple internal activity events to `flow_activities` for:

- work item created
- work item updated
- comment added
- label added
- attachment added

These events are local to Flow and are not a cross-service audit log yet.

## Response And Error Format

Health and readiness endpoints use a standard response envelope:

```json
{
  "success": true,
  "message": null,
  "data": {},
  "error": null
}
```

HTTP, validation, and unexpected errors use the same envelope with `success: false`.

## Tests

Run the current Flow service tests from the service directory:

```bash
cd services/flow-service
pytest tests
```

The tests use a disposable SQLite database at `tests/test_asthra_flow.db`. They cover:

- health and readiness endpoints
- create/list/get/update/delete work item
- create board and board column
- add comment
- add label
- add attachment metadata

## Optional Event Publishing

Flow can publish placeholder work item events:

- `flow.work_item.created`
- `flow.work_item.updated`

Set `EVENT_SERVICE_URL` and `EVENT_PUBLISHING_ENABLED=true` to enable later. Publishing is disabled by default and never blocks the main work item action.
