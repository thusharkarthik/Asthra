# Settings Members and Roles

## Role Catalog

Settings now uses a scoped Asthra role catalog instead of only the original Owner/Admin/Manager/Member/Viewer labels.

- Platform: Platform Owner, Platform Admin, Platform Support
- Organization: Organization Owner, Organization Admin, Organization Auditor
- Workspace: Workspace Admin, Workspace Manager, Workspace Member, Workspace Viewer
- Project: Project Admin, Project Manager, Project Contributor, Project Viewer
- Team: Team Lead, Team Member, Team Observer
- Functional: Product Owner, Scrum Master, Engineering Manager, Release Manager, Incident Commander, Knowledge Manager

Each role has a `name`, `key`, `scope`, description, and placeholder permission preset. Permission presets are not fully enforced across every service yet.

## Invite Flow

Settings -> Members supports inviting users by email within the current Settings scope.

- Organization-scoped pages invite to the organization.
- Workspace-scoped pages invite to the workspace and retain organization context.
- Role options are grouped by scope.
- Workspace invites show workspace roles plus functional roles.
- Platform roles are only shown for platform owners/admins.
- Existing users are added as members immediately when safe.
- Unknown emails create pending invitations.
- Duplicate pending invitations are rejected.

Pending invitations can be resent or cancelled from the member list.

## Invitation Notifications

When an existing user is invited, core-service creates an in-app notification. When a user signs up or loads the current user session with a matching email, pending invitations are synced into their notification center.

The notification text follows:

`You have been invited to Asthra as Workspace Member.`

Accept and Decline actions are visible as placeholders in the notification UI. The backend accept endpoint exists for token-based invitation acceptance, but notification-driven accept/decline actions still need a direct frontend flow.

## Member List

The member list combines active members and pending invitations.

Columns:

- Name
- Email
- Role
- Scope
- Status
- Joined or invited date
- Last active
- Actions

Search, role filter, status filter, scope filter, and sorting are client-side for now. Last active displays `Not tracked yet` until core-service stores real activity timestamps.

## RBAC Foundation

Frontend helpers now provide:

- `canManagePlatform`
- `canManageOrganization`
- `canManageWorkspace`
- `canManageProject`
- `canManageTeam`
- `canInviteMembers`
- `canManageRoles`
- `canViewAudit`

These helpers are UI visibility foundations only. Backend enforcement currently covers membership access, platform-role assignment protection, and last-owner protection.

## Safety Rules

- The last organization owner cannot be removed.
- The last organization owner cannot be downgraded.
- The last workspace owner cannot be removed or downgraded.
- Platform roles cannot be assigned by non-platform admins.
- Viewer-style roles hide member and role management actions.

## Current RBAC Limitations

- Project-scoped membership is still a future model.
- Role permission presets are placeholders.
- Cross-service authorization is not fully enforced yet.
- Notification Accept/Decline actions need direct invite-action endpoints.
- Last active timestamps are not tracked yet.
