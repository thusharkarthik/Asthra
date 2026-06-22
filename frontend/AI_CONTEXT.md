# Frontend Platform Context

## Purpose

The frontend provides the Asthra application shell, routing, scoped navigation, module screens, shared UI patterns, permission-aware actions, and client-side platform context.

## Routing Strategy

- Routes are organized by product module.
- Module dashboards provide entry points into operational workflows.
- Detail pages should include breadcrumbs and contextual back navigation.
- Cross-module routes should preserve organization, workspace, and project context.

## Layout Strategy

- The shell provides global navigation, bottom context selection, global search, notifications, theme controls, and user actions.
- Module pages should use consistent headers, summary cards, main content regions, loading states, empty states, and error states.
- UI behavior should remain consistent across Flow, Discover, Docs, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media.

## Scope Selection Behavior

- Organization selection controls available workspaces.
- Workspace selection controls available projects.
- Changing organization resets invalid workspace and project selections.
- Changing workspace resets invalid project selections.
- Selected scope should be reused across modules.

## Context Providers

- Authentication state stores the current session and token.
- Workspace context stores selected organization, workspace, and project.
- Notification and toast stores handle local UI feedback.
- Query providers manage server state and cache invalidation.

## TanStack Query Standards

- Use TanStack Query for server state.
- Use stable query keys.
- Prefer stale-while-revalidate behavior.
- Avoid infinite retries.
- Clear user-specific cache on logout.
- Invalidate affected queries after create, update, delete, invitation, role, permission, and scope changes.

## Permission Guards

- UI visibility must use permission codes.
- Do not use role names for access checks.
- Frontend permission guards are usability controls, not security boundaries.
- Backend APIs must still enforce protected actions.

## Shared UI Patterns

- Every page supports loading, empty, and error states.
- Every list should support search, filter, and sort when the workflow requires it.
- Every create/edit action should provide validation, cancel, loading, error, and success feedback.
- Avoid raw IDs as primary labels when names or titles are available.
