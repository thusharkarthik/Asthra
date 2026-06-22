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
