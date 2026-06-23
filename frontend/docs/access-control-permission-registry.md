# Access Control Permission Registry

Access Control now includes:

- Roles
- Permissions
- Role Mapping
- Assignments
- Permission Registry
- Permission Gaps

## Permission Registry

The registry tab shows generated permissions from Core.

Each row includes:

- permission code
- module
- resource
- action
- scope
- risk level
- sync status

## Permission Gaps

The gaps tab shows registry mismatches:

- missing permission records
- inactive registry permissions
- deprecated registry permissions

## Permission Filters

The Permissions tab supports filtering by:

- module
- resource
- action
- scope
- risk
- source
- status

## UI Enforcement Pattern

Frontend actions should use permission codes, not role names.

Examples:

- project edit: `settings.project.edit`
- project archive: `settings.project.archive`
- project restore: `settings.project.restore`
- team create: `settings.team.create`
- team edit: `settings.team.edit`
- team member add: `settings.team.member.add`

## Remaining Gaps

- Static UI action-key scanning is not automated yet.
- Endpoint coverage should continue moving from broad `manage` permissions to precise action permissions.
- System roles remain pattern mapped; custom role permission assignment is still manual.
