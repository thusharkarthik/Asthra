# Access Control Role Certification

The role certification page is a QA tool for validating scoped RBAC behavior.

Route:

`/settings/access-control/role-certification`

## What It Shows

- Role Certification Matrix: compares system roles against common capability columns.
- Scope Simulation: selects user, organization, workspace, project, or team.
- Action Test Runner: checks key action permissions for the selected scope.
- Effective Permissions: shows resolved permission codes.
- Permission Source Trace: explains which role and scope grant each permission.
- Export QA Report: downloads the current simulation as JSON.

## QA Usage

Use this page before role-by-role manual testing:

1. Pick a role test user.
2. Pick the relevant scope.
3. Confirm inherited roles match the expected hierarchy.
4. Confirm allowed and denied actions match the role expectations.
5. Export the report for QA evidence.

## Backend Contract

The page uses:

`GET /api/v1/access-control/debug/effective-access`

The response is diagnostic and should not replace backend enforcement. Runtime product actions still call protected endpoints and must enforce permissions server-side.
