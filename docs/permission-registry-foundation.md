# Permission Registry Foundation

Phase A provides a registry baseline, inventory endpoint, and gap detection. Phase B builds on it with a safe generator and sync process.

## Registry Resources

The registry now covers:

- `settings.organization`
- `settings.workspace`
- `settings.project`
- `settings.team`
- `settings.team.member`
- `settings.member`
- `settings.role`
- `settings.permission`
- `flow.work_item`
- `flow.board`
- `flow.backlog`
- `flow.sprint`
- `flow.release`
- `flow.workflow`
- `flow.custom_field`
- `flow.dependency`
- `flow.comment`
- `flow.attachment`
- `flow.report`
- `docs.space`
- `docs.page`
- `docs.comment`
- `docs.version`
- `docs.link`
- `discover.idea`
- `discover.feature_request`
- `discover.feedback`
- `discover.roadmap`
- `discover.validation`
- `discover.delivery`
- `desk.ticket`
- `desk.queue`
- `desk.comment`
- `desk.report`
- `pulse.incident`
- `pulse.service`
- `pulse.update`
- `pulse.postmortem`
- `pulse.report`
- `collab.thread`
- `collab.message`
- `collab.announcement`

## Inventory Endpoint

`GET /api/v1/access-control/permission-inventory`

Returns counts by:

- module
- resource
- action
- risk
- scope

It also reports:

- deprecated permissions
- malformed permission codes
- duplicate-like permissions
- unmapped permissions
- broad `manage` permissions
- roles using each permission

## Gap Endpoint

`GET /api/v1/access-control/permission-gaps`

Returns:

- missing expected baseline permissions
- existing permissions outside the baseline
- malformed permission codes
- broad permissions that may need splitting

## Sync Endpoints

`GET /api/v1/access-control/permission-registry/sync-preview`

Returns the permissions that would be created, updated, deprecated, or skipped without modifying the database.

`POST /api/v1/access-control/permission-registry/sync`

Applies the registry sync.

The sync:

- creates missing registry permissions
- updates registry permission metadata
- preserves custom permissions
- deprecates stale registry permissions
- does not delete permissions
- does not apply role mapping suggestions

## Role Mapping Suggestions

`GET /api/v1/access-control/role-mapping-suggestions`

Returns suggested permission bundles for system roles such as Organization Owner, Workspace Admin, Project Manager, Contributor, Viewer, and Auditor.

Suggestions are review-only. Administrators must explicitly apply any mapping changes.

## Critical Permissions Added

Phase A safely adds:

- `settings.project.archive`
- `settings.project.restore`
- `settings.project.edit`
- `settings.team.create`
- `settings.team.edit`
- `settings.team.delete`
- `settings.team.member.add`
- `settings.team.member.remove`
- `settings.workspace.edit`
- `settings.workspace.archive`
- `settings.workspace.restore`
- `settings.organization.edit`
- `settings.organization.archive`
- `settings.organization.restore`

## Adding Actions Safely

1. Add the expected action to the registry baseline.
2. Run the inventory and gap endpoints.
3. Run sync preview.
4. Sync registry permissions if the preview is correct.
5. Add backend enforcement using the exact permission code.
6. Add frontend visibility using the same permission code.
7. Review role mapping suggestions and explicitly update roles if needed.
