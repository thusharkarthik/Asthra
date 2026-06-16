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
- Added top-level `/settings/members`, `/settings/teams`, `/settings/roles`, and `/settings/permissions`.
- Added member detail, team detail, role detail, and permission detail pages.
- Replaced raw member IDs with profile-aware name, email, role, status, joined date, and actions.
- Added invite member dialog backed by core-service invitations.
- Added team member assignment from workspace members.
- Added project owner assignment from workspace members.
- Added organization tabs: Overview, Members, Workspaces, Roles, Permissions.
- Added workspace tabs: Overview, Members, Teams, Projects.
- Added role and permission search/filtering.
- Added simple permission matrix display.

## Backend Gaps

- Member removal is intentionally placeholder-safe until scoped confirmation UX is finalized.
- Role edit uses detail navigation, but inline edit forms are still light.
- Permission edit uses detail navigation, but inline edit forms are still light.
- Team lead is derived from creator until explicit lead assignment exists.
- Project/team linking is documented on team detail but not fully surfaced.

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

