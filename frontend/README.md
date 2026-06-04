# Asthra Frontend

Asthra Frontend is the platform shell for Asthra modules. It provides layout, navigation, workspace context, API client foundations, state stores, theme support, global search UI, the AI assistant dock, and first-pass module screens for the active MVP services.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui-style local components
- TanStack Query
- Zustand
- next-themes
- Vitest and Testing Library

## Folder Structure

```text
src/
  app/          App Router routes, layout, loading, error, not-found
  components/   Reusable UI, layout, navigation, search, assistant components
  features/     Feature-level composition placeholders
  layouts/      Platform shell layout
  hooks/        Shared hooks
  providers/    Query, theme, auth, workspace providers
  services/     API client and gateway request utilities
  stores/       Zustand stores
  types/        Shared TypeScript types
  lib/          Utilities
  styles/       Global Tailwind styles
```

## Routes

- `/`
- `/login`
- `/register`
- `/flow`
- `/flow/work-items`
- `/flow/work-items/[id]`
- `/flow/boards`
- `/docs`
- `/docs/spaces`
- `/docs/pages`
- `/docs/pages/[id]`
- `/discover`
- `/discover/ideas`
- `/discover/ideas/[id]`
- `/discover/roadmap`
- `/desk`
- `/desk/tickets`
- `/desk/tickets/[id]`
- `/desk/queues`
- `/pulse`
- `/pulse/alerts`
- `/pulse/incidents`
- `/pulse/incidents/[id]`
- `/pulse/status-pages`
- `/dev`
- `/dev/repositories`
- `/dev/deployments`
- `/dev/releases`
- `/dev/services`
- `/dev/services/[id]`
- `/collab`
- `/collab/threads`
- `/collab/threads/[id]`
- `/collab/announcements`
- `/collab/team-updates`
- `/automation`
- `/insights`
- `/insights/dashboards`
- `/insights/reports`
- `/insights/metrics`
- `/insights/usage`
- `/settings`

`/login` and `/register` are public. All platform shell routes are protected and redirect unauthenticated users to `/login`.

Flow, Docs, Discover, Desk, Pulse, Dev, Collab, and Insights now have first-pass module screens. Other module routes remain placeholders. The Home route shows real core-service counts where available and keeps placeholder module cards for later frontend phases.

## Environment

Create `frontend/.env.local` when running against local services:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_CORE_AUTH_LOGIN_PATH=/api/core/api/v1/auth/login
NEXT_PUBLIC_CORE_AUTH_REGISTER_PATH=/api/core/api/v1/auth/register
NEXT_PUBLIC_CORE_AUTH_ME_PATH=/api/core/api/v1/auth/me
NEXT_PUBLIC_ASSISTANT_CHAT_PATH=/api/ai/api/v1/assistant/chat
NEXT_PUBLIC_ASSISTANT_SESSIONS_PATH=/api/ai/api/v1/assistant/sessions
NEXT_PUBLIC_WORKSPACE_SEARCH_PATH=/api/memory/api/v1/workspace-search
```

The path variables are optional and exist so the auth routes can be adjusted without code changes if the gateway route shape changes.

## Local Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Run the API Gateway and core-service before using real auth:

```bash
docker compose up --build api-gateway core-service
```

## Tests

```bash
cd frontend
npm test
```

Current tests cover:

- shell rendering and protected-route redirect behavior
- sidebar rendering
- home dashboard count rendering
- login and register page rendering
- auth store behavior
- workspace selector behavior
- assistant panel rendering, no-workspace state, and mocked send-message flow
- global search rendering, grouped results, no-workspace state, and API error handling

## API Foundation

`src/services/api/client.ts` sends frontend requests through the API Gateway.

Defaults:

```text
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

The request wrapper adds:

- `Content-Type`
- `X-Request-ID`
- optional `Authorization`

Typed API modules:

- `authApi`: login, register, current user
- `coreApi`: current user and organizations
- `workspaceApi`: workspaces
- `projectApi`: projects
- `assistantApi`: assistant sessions, messages, and chat
- `memoryApi`: workspace memory search
- `searchApi`: frontend search facade over workspace memory search
- `flowApi`: work items, boards, board columns, and work item comments
- `docsApi`: spaces, pages, page comments, and page search
- `discoverApi`: ideas, feature requests, feedback, MVP plans, roadmap items, and AI idea analysis
- `deskApi`: tickets, queues, SLAs, approvals, incidents, change requests, comments, and AI classification
- `pulseApi`: alerts, incidents, timelines, schedules, escalation policies, status pages, postmortems, and AI summaries
- `devApi`: repositories, pull requests, environments, deployments, releases, service catalog, owners, dependencies, and AI release summary
- `collabApi`: threads, messages, mentions, reactions, announcements, activity stream, and team updates
- `insightsApi`: dashboards, widgets, metric definitions, metric snapshots, reports, report runs, insight events, and usage metrics

Current core-service gateway paths:

- `POST /api/core/api/v1/auth/login`
- `POST /api/core/api/v1/auth/register`
- `GET /api/core/api/v1/auth/me`
- `GET /api/core/api/v1/organizations`
- `GET /api/core/api/v1/workspaces`
- `GET /api/core/api/v1/projects`

Current AI/search gateway paths:

- `POST /api/ai/api/v1/assistant/chat`
- `GET /api/ai/api/v1/assistant/sessions`
- `POST /api/ai/api/v1/assistant/sessions`
- `GET /api/ai/api/v1/assistant/sessions/{session_id}/messages`
- `POST /api/memory/api/v1/workspace-search`

Current Flow gateway paths:

- `GET /api/flow/api/v1/work-items`
- `POST /api/flow/api/v1/work-items`
- `GET /api/flow/api/v1/work-items/{id}`
- `PATCH /api/flow/api/v1/work-items/{id}`
- `GET /api/flow/api/v1/boards`
- `POST /api/flow/api/v1/boards`
- `GET /api/flow/api/v1/boards/{board_id}/columns`
- `GET /api/flow/api/v1/work-items/{id}/comments`
- `POST /api/flow/api/v1/work-items/{id}/comments`

Current Docs gateway paths:

- `GET /api/docs/api/v1/spaces`
- `POST /api/docs/api/v1/spaces`
- `GET /api/docs/api/v1/pages`
- `POST /api/docs/api/v1/pages`
- `GET /api/docs/api/v1/pages/{id}`
- `PATCH /api/docs/api/v1/pages/{id}`
- `GET /api/docs/api/v1/pages/{id}/comments`
- `POST /api/docs/api/v1/pages/{id}/comments`
- `GET /api/docs/api/v1/search/pages?q=...`

Current Discover gateway paths:

- `GET /api/discover/api/v1/ideas`
- `POST /api/discover/api/v1/ideas`
- `GET /api/discover/api/v1/ideas/{id}`
- `POST /api/discover/api/v1/ideas/{id}/ai-analysis`
- `GET /api/discover/api/v1/ideas/{id}/mvp-plan`
- `GET /api/discover/api/v1/feature-requests`
- `GET /api/discover/api/v1/feedback`
- `GET /api/discover/api/v1/roadmap-items`
- `POST /api/discover/api/v1/roadmap-items`

Current Desk gateway paths:

- `GET /api/desk/api/v1/tickets`
- `POST /api/desk/api/v1/tickets`
- `GET /api/desk/api/v1/tickets/{id}`
- `POST /api/desk/api/v1/tickets/{id}/ai-classify`
- `GET /api/desk/api/v1/tickets/{id}/comments`
- `POST /api/desk/api/v1/tickets/{id}/comments`
- `GET /api/desk/api/v1/tickets/{id}/approvals`
- `GET /api/desk/api/v1/queues`
- `GET /api/desk/api/v1/slas`
- `GET /api/desk/api/v1/incidents`
- `GET /api/desk/api/v1/change-requests`

Current Pulse gateway paths:

- `GET /api/pulse/api/v1/alerts`
- `GET /api/pulse/api/v1/incidents`
- `POST /api/pulse/api/v1/incidents`
- `GET /api/pulse/api/v1/incidents/{id}`
- `POST /api/pulse/api/v1/incidents/{id}/ai-summary`
- `GET /api/pulse/api/v1/incidents/{id}/timeline`
- `GET /api/pulse/api/v1/incidents/{id}/postmortem`
- `GET /api/pulse/api/v1/on-call-schedules`
- `GET /api/pulse/api/v1/escalation-policies`
- `GET /api/pulse/api/v1/status-pages`
- `GET /api/pulse/api/v1/status-pages/{id}/components`

Current Dev gateway paths:

- `GET /api/dev/api/v1/repositories`
- `GET /api/dev/api/v1/pull-requests`
- `GET /api/dev/api/v1/environments`
- `GET /api/dev/api/v1/deployments`
- `GET /api/dev/api/v1/releases`
- `POST /api/dev/api/v1/releases/{id}/ai-summary`
- `GET /api/dev/api/v1/services`
- `GET /api/dev/api/v1/services/{id}`
- `GET /api/dev/api/v1/services/{id}/owners`
- `GET /api/dev/api/v1/services/{id}/dependencies`

Current Collab gateway paths:

- `GET /api/collab/api/v1/threads`
- `POST /api/collab/api/v1/threads`
- `GET /api/collab/api/v1/threads/{id}`
- `GET /api/collab/api/v1/threads/{id}/messages`
- `POST /api/collab/api/v1/threads/{id}/messages`
- `GET /api/collab/api/v1/mentions`
- `GET /api/collab/api/v1/reactions`
- `GET /api/collab/api/v1/announcements`
- `GET /api/collab/api/v1/activity-stream`
- `GET /api/collab/api/v1/team-updates`

Current Insights gateway paths:

- `GET /api/insights/api/v1/dashboards`
- `GET /api/insights/api/v1/dashboards/{id}/widgets`
- `GET /api/insights/api/v1/metrics/definitions`
- `GET /api/insights/api/v1/metrics/snapshots`
- `GET /api/insights/api/v1/reports`
- `GET /api/insights/api/v1/reports/{id}/runs`
- `GET /api/insights/api/v1/insight-events`
- `GET /api/insights/api/v1/usage-metrics`

## Auth Flow

The auth store uses Zustand with local storage persistence:

- `accessToken`
- `currentUser`
- `isAuthenticated`
- `login()`
- `register()`
- `logout()`
- `loadCurrentUser()`

The shell waits for store hydration before protecting routes. Expired or invalid sessions are cleared when `loadCurrentUser()` fails.

## Workspace Context

Workspace context is loaded from core-service through the gateway after authentication:

1. Load organizations.
2. Select the persisted organization or first available organization.
3. Load workspaces for the selected organization.
4. Select the persisted workspace or first available workspace.
5. Load projects for the selected workspace.

Selected organization, workspace, and project IDs are persisted in local storage. API failures show non-crashing empty/error states.

## AI Assistant

The right assistant panel is workspace-aware:

- Loads assistant sessions for the selected workspace.
- Creates a session on first message if none exists.
- Sends messages through the API Gateway to ai-service.
- Stores local message history in the assistant store.
- Shows assistant responses, sources, loading state, and API errors.

The assistant is read-only in this phase. It does not execute tools, mutate services, run agents, or trigger automation.

## Workspace Search

The global search dialog uses workspace memory search through the gateway. It debounces input and groups results by source type:

- `docs_page`
- `work_item`
- `idea`
- `support_ticket`
- `incident`
- `release`
- `discussion_thread`

Each result shows a title, source type, snippet/chunk text, and relevance score when returned. If no workspace is selected, search shows an empty state instead of calling the backend.

## Dashboard AI Widgets

The dashboard includes simple AI-native widgets for:

- Ask Asthra quick prompt
- Recent AI conversations placeholder
- Workspace memory status
- Search across workspace

These are shell-level widgets only. Full module-specific AI screens are intentionally deferred.

## Flow UI

Implemented first-pass Flow screens:

- `/flow`: dashboard with work item count, status summary, recent work items, and board link.
- `/flow/work-items`: work item list with status/priority badges, filters placeholder, and create dialog.
- `/flow/work-items/[id]`: detail view with description, status, priority, assignee, comments, and AI breakdown placeholder.
- `/flow/boards`: simple Kanban columns based on status IDs.

Flow UI uses the selected project from workspace context. If no project is selected, screens show a non-crashing empty state.

## Docs UI

Implemented first-pass Docs screens:

- `/docs`: dashboard with spaces count, pages count, recent pages, and search link.
- `/docs/spaces`: list spaces and create a workspace-scoped space.
- `/docs/pages`: list pages, create pages, and basic page search.
- `/docs/pages/[id]`: page detail with content display/edit mode, version placeholder, comments, and AI summary placeholder.

Docs UI uses the selected workspace where needed. Rich editing, nested page tree UX, and realtime collaboration are intentionally deferred.

## Discover UI

Implemented first-pass Discover screens:

- `/discover`: dashboard with idea, feature request, and roadmap counts plus recent ideas and roadmap preview.
- `/discover/ideas`: workspace-scoped ideas table and create dialog.
- `/discover/ideas/[id]`: idea detail with impact placeholder, MVP plan section, roadmap fit, and optional AI idea analysis action.
- `/discover/roadmap`: simple roadmap board grouped by planned, in-progress, and shipped status.

Discover UI uses the selected workspace and selected project where available. Impact scoring controls, validation note editing, and roadmap drag-and-drop are deferred.

## Desk UI

Implemented first-pass Desk screens:

- `/desk`: dashboard with ticket, queue, and SLA counts plus recent tickets.
- `/desk/tickets`: workspace-scoped ticket table and create dialog.
- `/desk/tickets/[id]`: ticket detail with SLA placeholder, approvals, comments, and optional AI classification action.
- `/desk/queues`: queue list with SLA summary.

Desk UI uses the selected workspace and selected project where available. Queue creation, SLA editing, approvals workflows, and change request detail screens are deferred.

## Pulse UI

Implemented first-pass Pulse screens:

- `/pulse`: dashboard with alert, incident, and status page counts plus active incidents.
- `/pulse/alerts`: alert list with severity and status badges.
- `/pulse/incidents`: workspace-scoped incident table and create dialog.
- `/pulse/incidents/[id]`: incident detail with timeline, postmortem, and optional AI summary action.
- `/pulse/status-pages`: status page overview.

Pulse UI uses the selected workspace. Timeline event creation, status page component editing, on-call schedule editing, and realtime incident collaboration are deferred.

## Dev UI

Implemented first-pass Dev screens:

- `/dev`: dashboard with repository, deployment, release, and service catalog summaries.
- `/dev/repositories`: repository list with provider, branch, and project context.
- `/dev/deployments`: deployment list with environment, service, version, and status.
- `/dev/releases`: release list with status badges and optional AI release summary action.
- `/dev/services`: service catalog list with lifecycle status.
- `/dev/services/[id]`: service detail with owners and dependency sections.

Dev UI uses the selected workspace. Repository creation, deployment mutation, service ownership editing, and dependency graph visuals are deferred.

## Collab UI

Implemented first-pass Collab screens:

- `/collab`: dashboard with thread, announcement, team update, and activity stream summaries.
- `/collab/threads`: thread list and create thread dialog.
- `/collab/threads/[id]`: thread detail with messages and message composer.
- `/collab/announcements`: announcement list.
- `/collab/team-updates`: team update list.

Collab UI uses the selected workspace and selected project where available. Realtime transport, reactions UI, mention creation, and rich-thread editing are deferred.

## Insights UI

Implemented first-pass Insights screens:

- `/insights`: dashboard with dashboard, metric, report, and insight event summaries.
- `/insights/dashboards`: dashboard card list and widget placeholder grid.
- `/insights/reports`: reports table with status badges.
- `/insights/metrics`: metric snapshot cards and metric definition table.
- `/insights/usage`: usage metrics table.

Insights UI uses the selected workspace. Advanced charts, cross-service aggregation, scheduled report runs, and custom dashboard builders are deferred.

## State Stores

- `auth-store`: token, current user, login/register/logout, session reload
- `workspace-store`: organizations, workspaces, projects, selected context
- `ui-store`: assistant/search panel state
- `assistant-store`: assistant sessions, local message history, active session, and error state

## Known Limitations

- Assistant and search require API Gateway routes to be available for real backend data.
- Search is only as complete as memory-service indexing.
- Assistant tools are read-only placeholders on the backend foundation.
- No frontend agent workflow or automation execution UI is implemented yet.
- Flow create forms use simple numeric defaults for type/status/priority until lookup UI is added.
- Docs uses a basic text input/textarea flow; no rich editor is implemented yet.
- Kanban boards are read-only and do not support drag-and-drop yet.
- Discover impact scoring and roadmap updates are read-only placeholders beyond basic idea creation.
- Desk queue/SLA management is currently summary-focused; ticket comments are supported.
- Pulse status pages and postmortems are display-focused; incident creation is supported.
- Dev screens are read-mostly; release AI summary is optional and service ownership/dependency editing is deferred.
- Collab does not implement realtime, reactions, mentions, or rich text yet.
- Insights uses tables and metric cards only; advanced charts and analytics composition are deferred.

## Next Frontend Modules

Planned next module UI passes:

- Automation
- Connect
- Guard
- Media

## Future Module Integration

Future modules should plug into the shell by adding route-specific feature components under `src/features/` and shared API calls under `src/services/`. Business functionality should stay module-scoped while shared platform concerns remain in providers, stores, layouts, and common components.
