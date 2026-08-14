# Core Scope Lifecycle Certification

Date: 2026-08-15
Status: Certification coverage added; runtime QA still required in a dependency-complete local app.

## Purpose

Certify the Core hierarchy lifecycle before returning to member lifecycle and deeper RBAC testing:

```text
Organization -> Workspace -> Project
```

This pass is certification/stabilization only. It does not change sidebar behavior, God Mode, bottom bar scope behavior, feature flag defaults, or RBAC permission codes.

## Architecture Found

Core owns the hierarchy resources:

- Organizations: `organizations`, `organization_members`
- Workspaces: `workspaces`, `workspace_members`
- Projects: `projects`, `project_memberships`, `project_teams`

Primary backend files:

- `app/models/organization.py`, `workspace.py`, `project.py`
- `app/schemas/organization.py`, `workspace.py`, `project.py`
- `app/repositories/organization_repository.py`, `workspace_repository.py`, `project_repository.py`
- `app/services/organization_service.py`, `workspace_service.py`, `project_service.py`
- `app/api/v1/organizations.py`, `workspaces.py`, `projects.py`

Read/list behavior:

- Lists default to active resources.
- Organization, workspace, and project lists support `status` and/or `include_inactive` for inactive/archived records.
- Detail endpoints load by id and can return archived/inactive records if the user still has scope access.
- Platform context lists active resources only through the service default list paths.

## Lifecycle Flow

### Organization

Endpoints:

- `POST /api/v1/organizations`
- `POST /api/v1/organizations/onboard`
- `POST /api/v1/organizations/platform-onboard`
- `GET /api/v1/organizations`
- `GET /api/v1/organizations/{organization_id}`
- `PATCH /api/v1/organizations/{organization_id}`
- `DELETE /api/v1/organizations/{organization_id}`

Behavior:

- Direct create creates an organization and an `organization_members` owner row for the creator.
- Self-serve onboarding additionally assigns `organization_owner` at organization scope and creates an onboarding notification.
- Platform onboarding assigns `organization_owner` to the selected existing owner user and creates a notification.
- Edit requires `settings.organization.edit`.
- Archive uses `PATCH is_active=false` or DELETE and requires `settings.organization.archive`.
- Restore uses `PATCH is_active=true` and requires `settings.organization.restore`.
- Archive/restore bumps organization context version and logs activity.

### Workspace

Endpoints:

- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces`
- `GET /api/v1/workspaces/{workspace_id}`
- `PATCH /api/v1/workspaces/{workspace_id}`
- `DELETE /api/v1/workspaces/{workspace_id}`

Behavior:

- Create requires `settings.workspace.create` at organization scope.
- Create adds a `workspace_members` owner row for the creator, but does not create a workspace role assignment.
- Edit requires `settings.workspace.edit` at workspace scope.
- Archive uses `PATCH is_active=false` or DELETE and requires `settings.workspace.archive`.
- Restore uses `PATCH is_active=true` and requires `settings.workspace.restore`.
- Create/update/archive/restore bump relevant context versions and log activity.

### Project

Endpoints:

- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/{project_id}`
- `PATCH /api/v1/projects/{project_id}`
- `DELETE /api/v1/projects/{project_id}`

Behavior:

- Create requires an active workspace parent and `settings.project.create` at workspace scope.
- Edit requires `settings.project.edit` at project scope.
- Archive uses `PATCH status=archived/is_active=false` or DELETE and requires `settings.project.archive`.
- Restore uses `PATCH status=active/is_active=true` and requires `settings.project.restore`.
- Archived project detail remains loadable by id for users with scope access.
- Project lists support `status=archived` and `status=all`.
- Project lifecycle mutations bump project/workspace/organization context versions and log activity.

## Permission Matrix

| Resource | Create | View / Detail | Edit | Archive | Restore |
|---|---|---|---|---|---|
| Organization | direct create is active-user/self-serve; platform-onboard requires `settings.organization.create` | scope access / membership / role access | `settings.organization.edit` | `settings.organization.archive` | `settings.organization.restore` |
| Workspace | `settings.workspace.create` at organization scope | workspace access / inherited scope access | `settings.workspace.edit` | `settings.workspace.archive` | `settings.workspace.restore` |
| Project | `settings.project.create` at workspace scope | workspace access / inherited scope access | `settings.project.edit` | `settings.project.archive` | `settings.project.restore` |

Superuser bypass remains handled by `AccessControlService`.

Organization roles inherit down to workspace/project permission resolution. Workspace roles inherit to projects. Project roles apply to project scope.

## Scope Isolation Rules

Certified by tests:

- An unrelated user cannot list or detail another user's organization/workspace/project resources.
- An unrelated user cannot create workspace/project children inside another user's scope.
- A view-only organization auditor can view allowed organization scope but cannot edit/archive/restore organizations, workspaces, or projects and cannot create child workspaces/projects.
- Lifecycle operations do not grant unrelated permissions or mutate role assignments, except intended owner assignments during onboarding/platform onboarding.

## Context / Version / Cache Behavior

Backend:

- `ContextVersionService.bump_organization_context(...)` increments organization context version.
- `ContextVersionService.bump_workspace_context(...)` increments workspace and parent organization context version.
- `ContextVersionService.bump_project_context(...)` increments project, workspace, and organization context version.
- Lifecycle mutations bump context versions, not access versions, unless RBAC/membership changes occur separately.
- `/api/v1/context/version` exposes the relevant organization/workspace/project context versions and max access version.
- `/api/v1/context/platform` returns active resources by default; archived/inactive resources are omitted from active context lists but remain accessible through canonical detail endpoints where permitted.

Frontend:

- Settings hierarchy pages use explicit Settings routes and backend APIs rather than bottom-bar work module context for detail pages.
- `invalidateSettingsAndContext(...)` invalidates organization/workspace/project lists, current permissions, context version, platform context, teams, invitations, and settings role/permission caches.
- Organization archive/restore has direct route-detail invalidation and no longer depends on active-only platform context for canonical state.
- Project detail fetches canonical `GET /projects/{id}` so archived project detail can refresh and restore.
- Workspace detail currently depends mainly on Settings data lists and exposes status through the edit dialog; explicit archive/restore button UX is less mature than organization/project.

## Audit / Activity Coverage

Producer coverage found:

| Action | Activity status |
|---|---|
| Organization create | audited as `organization.created` |
| Organization edit | audited as `organization.updated` |
| Organization archive | audited as `organization.deactivated` |
| Organization restore | audited as `organization.reactivated` |
| Workspace create | audited as `workspace.created` |
| Workspace edit | audited as `workspace.updated` |
| Workspace archive | audited as `workspace.archived` |
| Workspace restore | audited as `workspace.restored` |
| Project create | audited as `project.created` |
| Project edit | audited as `project.updated` |
| Project archive | audited as `project.archived` |
| Project restore | audited as `project.restored` |

Known producer note: repository create helpers also insert a create activity row, and service create methods log another richer create activity row. That can result in duplicate create events for hierarchy resources. This certification documents the behavior but does not change producer semantics.

## Tests Added

`services/core-service/tests/test_scope_lifecycle_certification.py`

Coverage:

- unauthenticated organization/workspace/project list/create/detail/update/delete rejection
- self-serve organization onboarding owner assignment
- organization read/update/archive/restore and inactive filter visibility
- workspace create/read/update/archive/restore and inactive filter visibility
- project update/archive/detail/archived-list/restore
- platform context active-resource omission after archive
- context version increments after lifecycle mutations
- unrelated user scope isolation across organization/workspace/project
- view-only organization auditor denied create/edit/archive/restore child actions
- role assignment count unchanged by ordinary lifecycle mutations
- project create rejects archived workspace parent
- audit action coverage for create/update/archive/restore

## Frontend Settings Behavior Checked

Inspected:

- `/settings/organizations`
- `/settings/organizations/[id]`
- `/settings/workspaces`
- `/settings/workspaces/[id]`
- `/settings/projects`
- `/settings/projects/[id]`
- `settings-admin-views.tsx`
- `settings-api.ts`
- `use-settings-mutations.ts`

Confirmed:

- Organization list has Active/Inactive/All status filter.
- Organization detail uses scoped permission query and canonical detail query.
- Organization archive/restore uses explicit `settings.organization.archive` / `settings.organization.restore` gates.
- Project list has Active/Archived/All status filter.
- Project detail uses canonical detail query and explicit archive/restore actions.
- Project create supports global Settings Projects mode and workspace-scoped mode.
- Settings invalidation refreshes platform context and context version after hierarchy mutations.

Frontend gaps:

- Workspace detail lifecycle UX is less explicit: status can be changed through Edit Workspace, while the danger zone still says archive/permanent deletion are placeholders.
- Workspace detail relies on Settings list data more than a canonical `GET /workspaces/{id}` detail query, so archived workspace refresh behavior should receive focused browser QA.
- Some create/list UI uses active platform/context-derived workspace/org arrays; global Settings pages fetch inactive-inclusive lists but sync only active resources into the workspace store, which is intentional for the bottom bar but important for manual QA.

## Known Gaps

- Direct `POST /organizations` is active-user self-serve but does not assign an `organization_owner` role assignment; `/organizations/onboard` is the role-assigning self-serve path. Product should decide whether direct create should be platform/admin-only or should also assign owner role.
- Workspace create checks that the organization exists but does not explicitly reject inactive organization parents today.
- Workspace archive/restore UI is not as polished or explicit as organization/project archive/restore UI.
- Hierarchy create actions may produce duplicate create activity rows because both repositories and services log create events.
- No hard-delete policy is defined for organization/workspace/project hierarchy resources.
- Cascade archive semantics are not fully defined: archiving an organization/workspace does not automatically archive descendants.
- Restore constraints are limited: descendants and parent active-state relationships are not comprehensively enforced beyond project create requiring an active workspace.

## Manual QA Checklist

1. Login as Superuser / Platform Owner.
2. Open Settings -> Organizations.
3. Create a test organization.
4. Edit organization name/metadata.
5. Archive organization.
6. Restore organization.
7. Confirm no maximum update depth error.
8. Confirm Settings does not show false Request Access.
9. Create workspace under organization.
10. Edit workspace.
11. Archive workspace.
12. Restore workspace.
13. Create project under workspace.
14. Edit project.
15. Archive project.
16. Restore project.
17. Confirm lists/details refresh after each action.
18. Confirm Platform Context reflects active resources.
19. Login as unauthorized user.
20. Confirm they cannot edit/archive/restore unrelated resources.
21. Confirm no unrelated roles/permissions were granted.

## Go / No-Go Criteria

Go for returning to member lifecycle/RBAC testing when:

- Targeted scope lifecycle tests pass in a dependency-complete environment.
- Manual browser QA confirms org/workspace/project lifecycle actions do not show false Request Access or stale detail state.
- Manual browser QA confirms archived detail restore works for organization/project and workspace behavior is either accepted or scheduled.
- Known gaps are accepted or scheduled.

No-go if:

- Archived detail routes become inaccessible for restore-capable users.
- Lifecycle mutations grant unrelated roles or permissions.
- Unrelated users can read or mutate another organization/workspace/project.
- Archive/restore causes platform-context request storms or maximum update depth errors.
