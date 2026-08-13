# Permission Registry Generator

The Permission Registry Generator is the Phase B foundation for keeping Asthra permissions systematic and action-based.

## Registry Structure

Registry permissions are defined as:

```text
module.resource.action
```

Examples:

- `settings.project.restore`
- `settings.team.member.add`
- `flow.work_item.transition`
- `docs.page.publish`
- `discover.feature_request.convert`
- `desk.ticket.resolve`
- `pulse.incident.close`
- `collab.announcement.publish`

The Phase B registry covers:

- settings
- flow
- docs
- discover
- desk
- pulse
- collab

Each resource declares only valid actions for that resource.

## Action Templates

Reusable templates keep registry definitions concise:

- CRUD: `view`, `create`, `edit`, `delete`
- Lifecycle: `archive`, `restore`
- Assignment: `assign`, `remove`
- Workflow: `start`, `complete`, `transition`, `approve`, `reject`, `cancel`
- Content: `publish`, `unpublish`, `comment`, `upload`, `download`
- Linking: `link`, `unlink`

Templates are expanded into concrete permission codes before sync.

## Sync Behavior

`sync_registry_permissions()` compares the structured registry with the database.

It:

- creates missing registry permissions
- updates metadata for existing registry permissions
- preserves custom permissions
- marks stale registry-owned permissions as deprecated
- does not delete permissions
- does not change role mappings

Custom permissions are identified by `source = custom` and are skipped by sync.

## API Endpoints

Preview:

```text
GET /api/v1/access-control/permission-registry/sync-preview
```

Apply:

```text
POST /api/v1/access-control/permission-registry/sync
```

Both return:

- created count
- updated count
- deprecated count
- skipped custom count
- detailed code lists
- errors

## Role Mapping Suggestions

Role mapping suggestions are available at:

```text
GET /api/v1/access-control/role-mapping-suggestions
```

Suggestions are read-only. The generator does not auto-map permissions to roles.

Examples:

- Organization Owner should usually receive organization-scoped settings, member, project, workspace, and team permissions.
- Project Manager should usually receive Flow work item, sprint, release, and report permissions.
- Viewer roles should usually receive view-only permissions.

## UI

Access Control includes:

- Permission Registry tab
- Permission Gaps tab
- Sync Preview action
- Sync Permissions action
- Role Mapping Suggestions section

The UI confirms before applying registry sync and explains that role mappings are not auto-applied.

## Enforcement Contract

Every managed action should define the same contract in the UI and backend:

- action key
- permission code
- scope type
- scope id

Example:

```text
actionKey = settings.project.restore
permissionCode = settings.project.restore
scopeType = project
scopeId = project.id
```

The backend resolver decides whether inherited roles provide the permission at that scope. The frontend only uses the permission code to show or hide actions.

## Adding a New Permission

1. Add the resource/action to the registry.
2. Run sync preview.
3. Confirm created/updated/deprecated results.
4. Run sync.
5. Add backend `requires_permission` enforcement where needed.
6. Use the same permission code in frontend `can(permissionCode)` checks.
7. Review role mapping suggestions and explicitly update role mappings if required.

## Future Work

Later phases can add:

- endpoint-to-permission scan reports
- UI action key scanning
- richer risk review workflows
- explicit role mapping proposal/apply flows
- event-driven permission cache invalidation
