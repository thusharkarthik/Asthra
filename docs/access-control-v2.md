# Access Control V2

Access Control V2 keeps the existing RBAC rule:

- users receive roles
- roles contain permissions
- users never receive permissions directly

Phase A focused on classifying and normalizing the current permission catalog. Phase B adds a registry generator and safe sync process for creating and maintaining registry-owned permissions.

## Permission Naming

Permissions use:

```text
module.resource.action
```

Examples:

- `settings.project.archive`
- `settings.project.restore`
- `settings.team.edit`
- `flow.work_item.create`
- `docs.page.publish`

## Metadata

Each permission should have:

- code
- name
- description
- module
- resource
- action
- scope
- risk level
- status
- source
- system flag
- timestamps

Existing permissions are backfilled from their code where metadata is missing.

## Registry Sync

Registry-owned permissions are generated from structured module/resource/action definitions.

Sync behavior:

- generate permission codes as `module.resource.action`
- create missing registry permissions
- update metadata for existing registry permissions
- preserve custom permissions
- mark registry-owned permissions that no longer exist in the registry as deprecated
- preserve role mappings unless an administrator explicitly changes them

Available endpoints:

- `GET /api/v1/access-control/permission-registry/sync-preview`
- `POST /api/v1/access-control/permission-registry/sync`

## Role Mapping Strategy

System roles continue to use role template patterns during bootstrap. The Phase B registry UI exposes role mapping suggestions as review-only guidance and does not automatically apply them.

Organization Owner inherits organization-scoped settings permissions into workspaces and projects under the organization, including project archive/restore/edit and team create/edit/delete/member actions.

## Phase B Modules

The Phase B generator covers:

- settings
- flow
- docs
- discover
- desk
- pulse
- collab

The registry can be expanded module by module without deleting custom permissions or forcing role mapping changes.

## Phase C Enforcement

Phase C standardizes permission resolution and enforcement.

Backend checks use the effective permission resolver:

- platform roles apply globally
- organization roles apply to the organization and child workspaces/projects
- workspace roles apply to the workspace and child projects
- project roles apply only to the project
- team roles apply only to the team

Archived or inactive records still participate in scope resolution so restore/archive actions can be authorized after refresh.

Critical Settings actions now use precise permission codes:

- `settings.organization.edit`
- `settings.organization.archive`
- `settings.organization.restore`
- `settings.workspace.edit`
- `settings.workspace.archive`
- `settings.workspace.restore`
- `settings.project.edit`
- `settings.project.archive`
- `settings.project.restore`
- `settings.team.create`
- `settings.team.edit`
- `settings.team.delete`
- `settings.team.member.add`
- `settings.team.member.remove`
- `settings.member.invite`
- `settings.member.remove`
- `settings.member.resend`
- `settings.member.cancel`

Frontend visibility uses the same permission codes through `can(permissionCode)`.

## Phase D UI Visibility

Phase D adds a frontend action registry and permission-aware UI primitives.

Frontend action definitions live in:

- `frontend/src/access/actionRegistry.ts`

Reusable components live in:

- `frontend/src/access/permission-components.tsx`

Supported primitives:

- `useActionAccess(actionKey, scope)`
- `Can`
- `PermissionAction`
- `PermissionButton`
- `PermissionMenuItem`

Managed Settings actions should render through action keys such as:

- `settings.project.restore`
- `settings.team.edit`
- `settings.member.invite`
- `settings.permission.manage`

The UI must not check role names for action visibility. It should check permission codes or action keys only.

The QA route is:

- `/settings/access-control/qa-matrix`

It shows the current user's allowed/denied result for registered actions and is intended for role-by-role QA.

## Role Certification QA

Role certification tooling adds a repeatable QA surface for scoped RBAC.

Frontend route:

- `/settings/access-control/role-certification`

Backend debug endpoint:

- `GET /api/v1/access-control/debug/effective-access`

The certification page allows admins/testers to select a user and scope, inspect direct and inherited roles, review effective permissions, run key action checks, view permission source traces, and export a JSON QA report.

The debug endpoint is diagnostic only. Product authorization still relies on normal protected endpoints and the backend permission resolver.
