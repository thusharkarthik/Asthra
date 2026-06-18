# Settings Operational Pass 2

## Summary

Settings now behaves more like an administrator control center instead of a setup placeholder. The pass focuses on operational administration only: organizations, workspaces, projects, members, teams, roles, permissions, and project ownership.

## Current CRUD Matrix

| Area | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Organizations | Complete | Complete | Partial | Partial |
| Workspaces | Complete | Complete | Partial | Partial |
| Projects | Complete | Complete | Partial | Partial |
| Members | Partial | Complete | Partial | Partial |
| Teams | Complete | Complete | Partial | Complete |
| Roles | Complete | Complete | Partial | Complete |
| Permissions | Complete | Complete | Partial | Complete |

## What Changed

- Added `/settings/administration` as the admin control center.
- Added lightweight Settings breadcrumbs, contextual back links, parent context headers, and hierarchy explanation without adding another sidebar or changing the existing Settings structure.
- Added top-level `/settings/members`, `/settings/teams`, `/settings/roles`, and `/settings/permissions`.
- Added member detail, team detail, role detail, and permission detail pages.
- Replaced raw member IDs with profile-aware name, email, role, status, joined date, and actions.
- Added invite member dialog backed by core-service invitations.
- Added team member assignment from workspace members.
- Added project owner assignment from workspace members.
- Added organization tabs: Overview, Members, Workspaces, Roles, Permissions.
- Added workspace tabs: Overview, Members, Teams, Projects.
- Added scoped organization/workspace headers on child admin pages.
- Added role and permission search/filtering.
- Added simple permission matrix display.

## Settings Navigation Map

Personal:

- `/settings/profile`
- `/settings/account`
- `/settings/preferences`
- `/settings/notifications`
- `/settings/api-keys`

Administration:

- `/settings/administration`
- `/settings/organizations`
- `/settings/organizations/[id]`
- `/settings/organizations/[id]/members`
- `/settings/organizations/[id]/workspaces`
- `/settings/organizations/[id]/roles`
- `/settings/organizations/[id]/permissions`
- `/settings/workspaces`
- `/settings/workspaces/[id]`
- `/settings/workspaces/[id]/members`
- `/settings/workspaces/[id]/teams`
- `/settings/workspaces/[id]/projects`
- `/settings/projects`
- `/settings/projects/[id]`
- `/settings/members`
- `/settings/members/[id]`
- `/settings/teams`
- `/settings/teams/[id]`
- `/settings/roles`
- `/settings/roles/[id]`
- `/settings/permissions`
- `/settings/permissions/[id]`

Platform placeholders:

- `/settings/security`
- `/settings/audit-logs`
- `/settings/integrations`
- `/settings/ai-preferences`

## Relationship Model

Asthra administration follows a clear hierarchy:

`Organization -> Workspaces -> Projects`

`Workspace -> Members -> Teams -> Projects`

Members can belong to an organization or workspace. Teams group workspace members. Projects belong to a workspace. Project owners should be selected from workspace members.

## Navigation Clarity

- Settings child pages now show breadcrumbs such as `Settings / Organizations / demo / Members`.
- Child pages include explicit back links such as `Back to Settings`, `Back to Organization`, or `Back to Workspace`.
- Organization-scoped pages keep the organization context visible.
- Workspace-scoped pages keep both workspace and parent organization context visible where available.
- Project detail explains that owners should be selected from workspace members when no owner is assigned.

## Backend Gaps

- Member removal is intentionally placeholder-safe until scoped confirmation UX is finalized.
- Role edit uses detail navigation, but inline edit forms are still light.
- Permission edit uses detail navigation, but inline edit forms are still light.
- Team lead is derived from creator until explicit lead assignment exists.
- Project/team linking is documented on team detail but not fully surfaced.
- Some profile details still depend on core-service user lookup; when only membership IDs are available, the UI shows the user ID as secondary text and explains that detailed lookup is pending.
- Security, audit logs, integrations, and AI preferences are still placeholders.

## Manual Admin Testing Checklist

1. Register or sign in.
2. Open `/settings/administration`.
3. Create an organization.
4. Create a workspace under the organization.
5. Create a project under the workspace.
6. Open members and invite a member by email.
7. Create a role.
8. Create a permission.
9. Open a member and assign a role.
10. Create a team.
11. Open the team and assign a workspace member.
12. Open the project detail and assign a project owner.
13. Navigate organization tabs and workspace tabs.
14. Confirm raw database IDs are not the primary admin experience.
