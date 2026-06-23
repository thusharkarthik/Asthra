# Access Control V2

Access Control V2 keeps the existing RBAC rule:

- users receive roles
- roles contain permissions
- users never receive permissions directly

Phase A focuses on classifying and normalizing the current permission catalog.

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

## Role Mapping Strategy

System roles continue to use role template patterns. Phase A adds only critical missing permissions for owner QA and does not rebuild all mappings.

Organization Owner inherits organization-scoped settings permissions into workspaces and projects under the organization, including project archive/restore/edit and team create/edit/delete/member actions.

## Phase B

Phase B can expand the registry into a full generator for every module action after Phase A inventory and gap reports are reviewed.
