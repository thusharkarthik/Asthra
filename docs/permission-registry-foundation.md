# Permission Registry Foundation

Phase A provides a registry baseline, inventory endpoint, and gap detection without mass-generating every possible permission.

## Baseline Resources

Current baseline covers:

- `settings.organization`
- `settings.workspace`
- `settings.project`
- `settings.team`
- `settings.team.member`
- `settings.member`
- `settings.role`
- `settings.permission`
- `flow.work_item`
- `flow.sprint`
- `flow.release`
- `flow.workflow`
- `docs.space`
- `docs.page`
- `discover.idea`
- `discover.roadmap`

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
3. Add backend enforcement using the exact permission code.
4. Add frontend visibility using the same permission code.
5. Confirm role templates grant it to the right system roles.
