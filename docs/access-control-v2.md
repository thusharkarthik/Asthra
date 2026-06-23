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
