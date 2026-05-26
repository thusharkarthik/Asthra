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
- `/api/v1/attachments`

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
  "type_id": 1,
  "status_id": 1,
  "priority_id": 1,
  "assignee_id": 2,
  "reporter_id": 1,
  "due_date": null
}
```

`project_id`, `title`, `type_id`, `status_id`, and `reporter_id` are required. `type_id`, `status_id`, and `priority_id` are validated against Flow lookup tables.

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

Board, comment, and label endpoints are implemented at a basic MVP level. Attachments, authentication integration, and persistence migrations will be added in later controlled tasks.

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

## Tests

Run the current Flow service tests from the service directory:

```bash
cd services/flow-service
pytest tests
```

The tests use an in-memory SQLite database and cover basic creation for work items, boards, comments, and labels.
