# Frontend Status

Asthra frontend is a Next.js platform shell connected to backend services through the API Gateway.

## Completed

- Authentication routes: `/login`, `/register`
- Protected shell with top navigation, sidebar, workspace/project selectors, global search, and assistant panel
- Module dashboards and MVP screens for Flow, Docs, Discover, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media
- Grouped platform navigation
- Command palette foundation with Ctrl+K / Cmd+K
- Shared loading, empty, error, retry, skeleton, badge, table, and detail components
- API Gateway request wrapper with request IDs, auth forwarding, friendly API errors, and network error handling
- Settings foundation for profile, workspace context, and preferences

## Deferred

- Realtime collaboration
- Drag-and-drop boards and roadmaps
- File upload/storage
- Advanced analytics charts
- Agent or automation execution UI
- Persisted frontend preferences
- Full edit/create flows for every backend entity

## Test Coverage

Frontend tests use Vitest and Testing Library with mocked APIs. They cover shell protection, navigation, home dashboard, command palette, shared UI states, auth pages, workspace selection, search, assistant, settings, and current module pages.
