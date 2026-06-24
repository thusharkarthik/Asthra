# Core Service Context

## Purpose

Identity, scope, membership, and access control.

## Owned Data

- Users
- Organizations
- Workspaces
- Projects
- Teams
- Roles
- Permissions
- Memberships
- Invitations
- Notifications

## Not Owned Data

- Work items
- Pages
- Ideas
- Tickets
- Incidents
- Files

## APIs

- Authentication
- Current user
- Organizations
- Workspaces
- Projects
- Teams
- Members
- Invitations
- Notifications
- Roles
- Permissions
- Permission Registry
- Permission Gaps
- Role assignments
- Effective permissions

## Events Published

- UserCreated
- OrganizationCreated
- WorkspaceCreated
- ProjectCreated
- TeamCreated
- MemberInvited
- RoleAssigned

## Events Consumed

- Future audit events
- Future notification events

## RBAC Rules

- Core is the source of truth for roles and permissions.
- Users never receive permissions directly.
- Users receive roles at platform, organization, workspace, project, or team scope.
- Effective permissions are resolved from scoped roles.
- Permissions are generated from the Core permission registry using `module.resource.action`.
- User-facing actions should use precise permission codes such as `settings.project.restore` and `settings.team.edit`.
- Static protected endpoints should use `require_permission(...)` from `app.core.permissions`.
- Dynamic payload-sensitive actions should enforce permissions in the service method using `AccessControlService.require(...)`.

## UI Screens

- Settings
- Organizations
- Workspaces
- Projects
- Teams
- Members
- Access Control
- Notifications

## Future Roadmap

- Full scoped permission enforcement
- Invitation acceptance lifecycle
- Audit views
- Organization policy controls
