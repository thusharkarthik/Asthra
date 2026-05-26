# Asthra Core Service

Level 2 foundation backend skeleton for Asthra Core.

This service is intentionally limited to the platform foundation: users, organizations, workspaces, teams, roles, projects, activity logs, and MVP authentication. It does not implement Flow, Docs, AI, RAG, agents, automation, or frontend functionality.

## Setup

```bash
cd services/core-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

API routes are mounted under `/api/v1`.

## Environment Variables

```text
ASTHRA_ENV=development
ASTHRA_SERVICE_NAME=asthra-core-service
ASTHRA_API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=postgresql+psycopg://asthra:asthra@localhost:5432/asthra_core
SECRET_KEY=change-me-in-local-env
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

For local SQLite development, set:

```text
DATABASE_URL=sqlite:///./asthra_core.db
```

## Auth Endpoints

### Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "change-me",
  "full_name": "Example User"
}
```

Returns the created user profile. Duplicate emails return `409 Conflict`.

### Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "change-me"
}
```

Returns:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <jwt>
```

Returns the current user profile for a valid bearer token.

## Organization Endpoints

All organization endpoints require a JWT bearer token.

### Create Organization

```http
POST /api/v1/organizations
Authorization: Bearer <jwt>
```

Request:

```json
{
  "name": "Acme",
  "description": "Primary operating organization"
}
```

The creating user is added as the organization `owner`, and a basic activity log entry is recorded.

### List Organizations

```http
GET /api/v1/organizations
Authorization: Bearer <jwt>
```

Returns active organizations visible to the current user.

### Get Organization

```http
GET /api/v1/organizations/{organization_id}
Authorization: Bearer <jwt>
```

Returns a single organization if the user has access.

### Update Organization

```http
PATCH /api/v1/organizations/{organization_id}
Authorization: Bearer <jwt>
```

Request:

```json
{
  "name": "Acme Platform",
  "description": "Updated organization description"
}
```

### Delete Organization

```http
DELETE /api/v1/organizations/{organization_id}
Authorization: Bearer <jwt>
```

Performs a soft delete by setting `is_active` to `false`.

### List Organization Members

```http
GET /api/v1/organizations/{organization_id}/members
Authorization: Bearer <jwt>
```

Returns organization membership records for users with organization access.

## Workspace Endpoints

All workspace endpoints require a JWT bearer token.

### Create Workspace

```http
POST /api/v1/workspaces
Authorization: Bearer <jwt>
```

Request:

```json
{
  "organization_id": 1,
  "name": "Platform",
  "description": "Core platform workspace"
}
```

The creating user is added as the workspace `owner`, and a basic activity log entry is recorded.

### List Workspaces

```http
GET /api/v1/workspaces
Authorization: Bearer <jwt>
```

Returns active workspaces visible to the current user.

### Get Workspace

```http
GET /api/v1/workspaces/{workspace_id}
Authorization: Bearer <jwt>
```

Returns a single workspace if the user has access.

### Update Workspace

```http
PATCH /api/v1/workspaces/{workspace_id}
Authorization: Bearer <jwt>
```

Request:

```json
{
  "name": "Platform Core",
  "description": "Updated workspace description"
}
```

### Delete Workspace

```http
DELETE /api/v1/workspaces/{workspace_id}
Authorization: Bearer <jwt>
```

Performs a soft delete by setting `is_active` to `false`.

### List Workspace Members

```http
GET /api/v1/workspaces/{workspace_id}/members
Authorization: Bearer <jwt>
```

Returns the workspace membership records for users with workspace access.

## Team Endpoints

All team endpoints require a JWT bearer token. Team access is scoped to the parent workspace: users must have access to the workspace unless they are superusers.

### Create Team

```http
POST /api/v1/teams
Authorization: Bearer <jwt>
```

Request:

```json
{
  "workspace_id": 1,
  "name": "Core Engineering",
  "description": "Team responsible for Asthra Core"
}
```

The creating user is added as the team `owner`, and a basic activity log entry is recorded.

### List Teams

```http
GET /api/v1/teams
Authorization: Bearer <jwt>
```

Returns active teams visible through the current user's workspace memberships.

### Get Team

```http
GET /api/v1/teams/{team_id}
Authorization: Bearer <jwt>
```

Returns a single team if the user has access to the parent workspace.

### Update Team

```http
PATCH /api/v1/teams/{team_id}
Authorization: Bearer <jwt>
```

Request:

```json
{
  "name": "Core Platform",
  "description": "Updated team description"
}
```

### Delete Team

```http
DELETE /api/v1/teams/{team_id}
Authorization: Bearer <jwt>
```

Performs a soft delete by setting `is_active` to `false`.

### Add Team Member

```http
POST /api/v1/teams/{team_id}/members
Authorization: Bearer <jwt>
```

Request:

```json
{
  "user_id": 2,
  "member_role": "member"
}
```

The target user must already be a member of the team's workspace. Duplicate team members return `409 Conflict`.

### List Team Members

```http
GET /api/v1/teams/{team_id}/members
Authorization: Bearer <jwt>
```

Returns team membership records.

### Remove Team Member

```http
DELETE /api/v1/teams/{team_id}/members/{user_id}
Authorization: Bearer <jwt>
```

Removes the user from the team and records a basic activity log entry.

## Structure

```text
app/
  api/v1/          Versioned routers.
  core/            Configuration and security helpers.
  db/              SQLAlchemy session and metadata base.
  models/          SQLAlchemy models.
  repositories/    Data-access layer placeholders.
  schemas/         Pydantic request and response schemas.
  services/        Business-service layer placeholders.
  utils/           Utility helpers.
alembic/           Migration environment placeholder.
```

## Database

SQLAlchemy is configured in `app/db/session.py`. Alembic uses `app.db.base.Base.metadata` for model discovery.

Create a migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
```

Apply migrations:

```bash
alembic upgrade head
```
