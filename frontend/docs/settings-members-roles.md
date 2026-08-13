# Settings Members and Roles

## Role Catalog

Settings now uses a scoped Asthra role catalog instead of only the original Owner/Admin/Manager/Member/Viewer labels.

- Platform: Platform Owner, Platform Admin, Platform Support
- Organization: Organization Owner, Organization Admin, Organization Auditor
- Workspace: Workspace Admin, Workspace Manager, Workspace Member, Workspace Viewer
- Project: Project Admin, Project Manager, Project Contributor, Project Viewer
- Team: Team Lead, Team Member, Team Observer
- Functional: Product Owner, Scrum Master, Engineering Manager, Release Manager, Incident Commander, Knowledge Manager

Each role has a `name`, `key`, `scope`, description, and permission mappings. Users receive roles; roles contain permissions; permissions drive access checks.

## Authority-Based Scope for `/settings/members`

The `/settings/members` page derives its scope from the **logged-in user's authority** — not from the bottom bar workspace/organization selector. Changing the bottom bar has zero effect on this page.

Scope resolution order:

1. **Superuser** (`currentUser.is_superuser = true`) → global platform directory. No additional queries needed.
2. **Platform admin/owner** (role key in `superuser | platform_owner | platform_admin` from `/me/permissions` with no scope params) → global platform directory.
3. **Organization admin/owner** (active `RoleAssignment` with `scope_type="organization"` and role key in `organization_owner | organization_admin`) → org-scoped members for that organization.
4. **Workspace admin/manager** (active `RoleAssignment` with `scope_type="workspace"` and role key in `workspace_admin | workspace_manager`) → workspace-scoped members for that workspace.
5. **No elevated authority** → global directory (limited access shown based on permissions).

The page fetches three queries (disabled for superusers):
- `GET /me/permissions` with no scope params (platform scope) — detects platform-level roles
- `GET /role-assignments?user_id={id}&status=active` — detects org/workspace admin roles
- `GET /roles` — cross-references role IDs to role keys

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

## RBAC Enforcement Foundation

Core-service now exposes:

- `GET /api/v1/me/permissions`
- `get_user_permissions(user_id, scope_type, scope_id)`
- `can(user_id, permission_code, scope_type, scope_id)`

The resolver includes inherited roles:

- Organization roles apply inside that organization and its workspaces/projects.
- Workspace roles apply inside that workspace and its projects.
- Direct platform roles apply globally.

Settings actions now use permission codes instead of role names.

Protected actions:

- Invite member: `settings.member.invite`
- Remove member: `settings.member.remove`
- Change role/manage role mapping: `settings.role.manage`
- Create permission: `settings.permission.manage`
- Manage organization: `settings.organization.manage`
- Manage workspace: `settings.workspace.manage`
- Manage project: `settings.project.manage`

The frontend loads `/me/permissions` for the active Settings scope and hides or disables actions from those permission codes. It also shows a small Current User Permissions debug panel in Access Control for internal testing.

## Safety Rules

- The last organization owner cannot be removed.
- The last organization owner cannot be downgraded.
- The last workspace owner cannot be removed or downgraded.
- Platform roles cannot be assigned by non-platform admins.
- Viewer-style roles hide member and role management actions.

## Current RBAC Limitations

- Project-scoped membership is still a future model.
- Cross-service authorization is not fully enforced yet.
- Enforcement currently starts with Settings endpoints.
- Notification Accept/Decline actions need direct invite-action endpoints.
- Last active timestamps are not tracked yet.
- First-organization creation remains open as a bootstrap path for clean local installs.

## Invite Scope Validation

`scopeOrganizationId` in `MembersView` is derived strictly from props — no silent fallbacks:

```
scopeOrganizationId = organizationId
  ?? workspaces.find(w => w.id === workspaceId)?.organization_id
  ?? null   // no organizations[0] fallback
```

If `scopeOrganizationId` is `null` in global directory mode, the invite dialog shows "No scope — navigate to an organization or workspace" and the submit guard fires before the API call.
