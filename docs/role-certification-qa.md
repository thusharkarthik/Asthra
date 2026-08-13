# Role Certification QA

Asthra role QA should validate roles, scope inheritance, permissions, and visible actions together.

## Certification Page

Frontend route:

`/settings/access-control/role-certification`

The page provides:

- role certification matrix
- user and scope simulator
- action test runner
- effective permission list
- permission source trace
- JSON report export

## Debug Endpoint

Core-service endpoint:

`GET /api/v1/access-control/debug/effective-access`

Query parameters:

- `user_id`
- `scope_type`
- `scope_id`
- `action_keys`

The endpoint returns:

- direct roles
- inherited roles
- effective permissions
- action results
- permission source trace

The endpoint is intended for admin/dev QA and requires permission management access.

## Required QA Flow

1. Select the test user.
2. Select organization, workspace, project, or team scope.
3. Verify direct roles.
4. Verify inherited roles.
5. Verify key action results.
6. Confirm permission source trace explains allowed actions.
7. Export the QA report.

## Key Actions

The current action runner checks:

- `settings.organization.edit`
- `settings.workspace.create`
- `settings.workspace.edit`
- `settings.project.create`
- `settings.project.edit`
- `settings.project.archive`
- `settings.project.restore`
- `settings.team.create`
- `settings.team.edit`
- `settings.team.delete`
- `settings.member.invite`
- `settings.member.remove`
- `settings.member.role.assign`

## Certification Rule

Users never receive permissions directly. A passing certification must show that access comes from roles assigned at the selected scope or inherited from a higher scope.
