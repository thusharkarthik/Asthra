# Asthra Flow Service

Asthra Flow is the work management service for Asthra. It handles the operational work layer around projects: work items, statuses, priorities, assignments, comments, labels, attachment metadata, and basic boards.

Flow is intentionally separate from Core. It references Core projects and users by ID, while Core remains the source of truth for users, organizations, workspaces, teams, and projects.

## Purpose

Asthra Flow provides the Tier 2 work management foundation. Its current role is to model and expose the basic workflows needed to create, organize, discuss, label, and track project work.

This service does not implement AI, RAG, agents, automation, realtime collaboration, or frontend behavior.

## Entities

- `WorkItem`: task, bug, story, epic, or other tracked work.
- `WorkItemType`: lookup table for work item categories such as task, bug, story, and epic.
- `WorkItemStatus`: lookup table for workflow states such as todo, in progress, review, and done.
- `WorkItemPriority`: lookup table for priority levels.
- `WorkItemComment`: discussion entries on work items.
- `WorkItemLabel`: project-scoped labels that can be attached to work items.
- `WorkItemAttachment`: metadata for external file references; Flow does not store file bytes.
- `Board`: project-scoped board.
- `BoardColumn`: board columns linked optionally to statuses.
- `FlowActivity`: lightweight local activity events for Flow changes.

## Endpoints

Health:

- `GET /health`
- `GET /ready`

Work items:

- `POST /api/v1/work-items`
- `GET /api/v1/work-items`
- `GET /api/v1/work-items/{work_item_id}`
- `PATCH /api/v1/work-items/{work_item_id}`
- `DELETE /api/v1/work-items/{work_item_id}`

Boards:

- `POST /api/v1/boards`
- `GET /api/v1/boards`
- `GET /api/v1/boards/{board_id}`
- `POST /api/v1/boards/{board_id}/columns`
- `GET /api/v1/boards/{board_id}/columns`

Comments, labels, and attachments:

- `POST /api/v1/work-items/{work_item_id}/comments`
- `GET /api/v1/work-items/{work_item_id}/comments`
- `POST /api/v1/labels`
- `GET /api/v1/labels`
- `POST /api/v1/work-items/{work_item_id}/labels`
- `POST /api/v1/work-items/{work_item_id}/attachments`
- `GET /api/v1/work-items/{work_item_id}/attachments`
- `DELETE /api/v1/work-items/{work_item_id}/attachments/{attachment_id}`

## Local Run

From the Flow service directory:

```bash
cd services/flow-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The service starts on `http://127.0.0.1:8000` by default.

Seed default lookup data after tables exist:

```bash
python scripts/seed_flow_defaults.py
```

## Docker Run

From the repository root:

```bash
docker compose up --build flow-service
```

The compose service exposes Flow on `http://127.0.0.1:8001`.

## Tests

From the Flow service directory:

```bash
cd services/flow-service
pytest tests
```

The tests use a disposable SQLite database under `tests/` and cover health, work item CRUD, boards, board columns, comments, labels, and attachment metadata.

## Future Roadmap

Later tiers can add:

- Core JWT and membership enforcement.
- Alembic migrations and managed deployment database setup.
- Sprint planning and backlog workflows.
- Roadmap views and dependency mapping.
- Board drag/drop ordering and richer workflow rules.
- Reporting and sprint analytics.
- AI-assisted task generation after the AI layer is explicitly scheduled.
- Automation hooks after Asthra Automate is explicitly scheduled.
