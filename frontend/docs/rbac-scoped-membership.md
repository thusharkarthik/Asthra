# RBAC Scoped Membership

## Purpose

Asthra access is now modeled as scoped role assignment.

Users never receive permissions directly. Users receive roles at a scope, roles contain permissions, and effective permissions are resolved for the active scope.

## Scope Hierarchy

Platform
-> Organization
-> Workspace
-> Project
-> Team

Inheritance rules:

- Platform roles apply everywhere.
- Organization roles apply to workspaces and projects inside that organization.
- Workspace roles apply to projects inside that workspace.
- Project roles apply only to that project.
- Team roles apply only inside that team.

## Membership Models

Role assignments store the access grant:

- user
- role
- scope type
- scope id
- status
- assigned by
- assigned/revoked timestamps

Project memberships store who belongs to a project and the project role/team context.

Team memberships store who belongs to a team and the team role context.

## Settings UI

Access Control now includes an Assignments tab.

The member detail page shows:

- legacy compatibility roles
- scoped role assignments
- direct roles
- inherited roles
- effective permission codes grouped by module

Project detail pages show project members and allow adding a workspace member to a project role.

Team detail pages show team members and team-scoped roles.

## Demo Seed

Run the local reset seed from inside `services/core-service`:

```bash
python scripts/reset_seed_core_demo.py
```

It creates:

- Asthra Labs organization
- Engineering workspace
- Asthra Platform, Asthra Flow, and Asthra Docs projects
- Backend Team, Frontend Team, and Platform Team
- Admin, John, Sarah, Mike, and Priya users
- scoped role assignments for platform, workspace, project, and team scopes

## Remaining Gaps

- Team-to-project navigation is still basic.
- Assignment creation currently accepts a user id until the user lookup UI is expanded.
- Full backend RBAC enforcement is currently focused on Settings endpoints.
- Activity/audit display for role assignment events is stored backend-side but not yet presented as a full activity feed.
