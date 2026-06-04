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
- `/favorites`
- `/login`
- `/platform/health`
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
- `/discover/feature-requests`
- `/discover/feedback`
- `/discover/roadmap`
- `/discover/validation`
- `/discover/prioritization`
- `/desk`
- `/desk/tickets`
- `/desk/tickets/[id]`
- `/desk/queues`
- `/desk/slas`
- `/desk/approvals`
- `/desk/incidents`
- `/desk/change-requests`
- `/pulse`
- `/pulse/alerts`
- `/pulse/incidents`
- `/pulse/incidents/[id]`
- `/pulse/status-pages`
- `/pulse/on-call`
- `/pulse/escalations`
- `/pulse/postmortems`
- `/dev`
- `/dev/repositories`
- `/dev/pull-requests`
- `/dev/environments`
- `/dev/deployments`
- `/dev/releases`
- `/dev/services`
- `/dev/services/[id]`
- `/dev/dependencies`
- `/collab`
- `/collab/threads`
- `/collab/threads/[id]`
- `/collab/mentions`
- `/collab/announcements`
- `/collab/team-updates`
- `/collab/activity`
- `/automation`
- `/automation/workflows`
- `/automation/workflows/[id]`
- `/automation/executions`
- `/automation/schedules`
- `/automation/templates`
- `/automation/audit-logs`
- `/connect`
- `/connect/integrations`
- `/connect/connectors`
- `/connect/webhooks`
- `/connect/sync-jobs`
- `/connect/api-connections`
- `/connect/event-subscriptions`
- `/guard`
- `/guard/policies`
- `/guard/audit-events`
- `/guard/risks`
- `/guard/compliance`
- `/guard/access-reviews`
- `/guard/retention`
- `/guard/exceptions`
- `/insights`
- `/insights/dashboards`
- `/insights/widgets`
- `/insights/reports`
- `/insights/metrics`
- `/insights/usage`
- `/insights/events`
- `/media`
- `/media/assets`
- `/media/assets/[id]`
- `/media/collections`
- `/media/processing-jobs`
- `/media/transcripts`
- `/media/annotations`
- `/media/tags`
- `/insights`
- `/insights/dashboards`
- `/insights/reports`
- `/insights/metrics`
- `/insights/usage`
- `/media`
- `/media/assets`
- `/media/assets/[id]`
- `/media/collections`
- `/media/processing-jobs`
- `/settings`
- `/settings/profile`
- `/settings/workspace`
- `/settings/preferences`

`/login` and `/register` are public. All platform shell routes are protected and redirect unauthenticated users to `/login`.

Flow, Docs, Discover, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media now have first-pass module screens. The Home route shows real core-service counts where available and keeps placeholder module cards for later frontend phases.

## Navigation Structure

Sidebar navigation is grouped into platform areas:

- Platform: Home, Search, Assistant, Favorites, Platform Health
- Work: Flow, Discover, Docs, Collab
- Operations: Desk, Pulse, Automation
- Engineering: Dev, Connect
- Intelligence: Insights, Memory placeholder
- Admin: Guard, Media, Settings

Nested routes keep their parent module highlighted. The desktop sidebar supports an icon-only collapsed mode for the current browser session. Persisted compact mode is deferred.

## Command Palette

Press `Ctrl+K` or `Cmd+K` to open the command palette.

Current commands:

- Go to Home
- Go to module routes
- Open Assistant
- Search Workspace

The command palette is shell-local in this phase. It does not run backend mutations, agents, or automation.

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

## Demo Path

For a beta demo:

1. Start the frontend, API Gateway, and needed backend services.
2. Register or log in.
3. Select organization, workspace, and project context.
4. Review Home for workspace summary, quick launch, assistant/search shortcuts, recent activity placeholders, recent AI conversations, recent search results, and module status.
5. Use grouped sidebar navigation or `Ctrl+K` / `Cmd+K` command palette to move between modules.
6. Open global search and the assistant panel.
7. Visit module dashboards across Work, Operations, Engineering, Intelligence, and Admin.
8. Review Settings, Profile, Workspace, and Preferences.

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

It also normalizes:

- backend error envelopes
- FastAPI `detail` responses
- unauthorized/session-expired placeholder messages
- network failures when the API Gateway is unreachable

## Shared UI States

Reusable shell states live in `src/components/layout/ui-states.tsx`:

- `PageLoading`
- `SectionLoading`
- `TableSkeleton`
- `CardSkeleton`
- `EmptyModuleState`
- `ErrorState`
- `RetryButton`

`src/components/layout/module-page-shell.tsx` provides the standard module layout structure:

- `PageHeader`
- optional primary actions
- summary cards
- loading state
- error state
- empty state
- main content area

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
- `automationApi`: workflows, triggers, conditions, actions, executions, schedules, and audit logs
- `connectApi`: integrations, connectors, webhooks, deliveries, subscriptions, sync jobs, and API connections
- `guardApi`: security policies, access reviews, compliance checks, audit events, retention policies, risk findings, and security exceptions
- `insightsApi`: dashboards, widgets, metric definitions, metric snapshots, reports, report runs, insight events, and usage metrics
- `mediaApi`: media assets, collections, transcripts, annotations, processing jobs, and tags
- `platformApi`: activity, notifications, recent items, favorites, relationships, dashboard summary, and platform health

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
- `POST /api/discover/api/v1/feature-requests`
- `GET /api/discover/api/v1/feedback`
- `POST /api/discover/api/v1/feedback`
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
- `PATCH /api/desk/api/v1/approvals/{id}`
- `GET /api/desk/api/v1/queues`
- `POST /api/desk/api/v1/queues`
- `GET /api/desk/api/v1/slas`
- `POST /api/desk/api/v1/slas`
- `GET /api/desk/api/v1/incidents`
- `GET /api/desk/api/v1/change-requests`
- `POST /api/desk/api/v1/change-requests`

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

Current Automation gateway paths:

- `GET /api/automation/api/v1/workflows`
- `GET /api/automation/api/v1/workflows/{id}`
- `GET /api/automation/api/v1/workflows/{id}/triggers`
- `GET /api/automation/api/v1/workflows/{id}/conditions`
- `GET /api/automation/api/v1/workflows/{id}/actions`
- `GET /api/automation/api/v1/executions`
- `GET /api/automation/api/v1/schedules`
- `GET /api/automation/api/v1/audit-logs`

Current Connect gateway paths:

- `GET /api/connect/api/v1/integrations`
- `GET /api/connect/api/v1/connectors`
- `GET /api/connect/api/v1/webhooks`
- `GET /api/connect/api/v1/webhook-deliveries`
- `GET /api/connect/api/v1/event-subscriptions`
- `GET /api/connect/api/v1/sync-jobs`
- `GET /api/connect/api/v1/api-connections`

Current Guard gateway paths:

- `GET /api/guard/api/v1/security-policies`
- `GET /api/guard/api/v1/access-reviews`
- `GET /api/guard/api/v1/compliance-checks`
- `GET /api/guard/api/v1/audit-events`
- `GET /api/guard/api/v1/data-retention-policies`
- `GET /api/guard/api/v1/risk-findings`
- `GET /api/guard/api/v1/security-exceptions`

Current Insights gateway paths:

- `GET /api/insights/api/v1/dashboards`
- `GET /api/insights/api/v1/dashboards/{id}/widgets`
- `GET /api/insights/api/v1/metrics/definitions`
- `GET /api/insights/api/v1/metrics/snapshots`
- `GET /api/insights/api/v1/reports`
- `GET /api/insights/api/v1/reports/{id}/runs`
- `GET /api/insights/api/v1/insight-events`
- `GET /api/insights/api/v1/usage-metrics`

Current Media gateway paths:

- `GET /api/media/api/v1/media-assets`
- `GET /api/media/api/v1/media-assets/{id}`
- `GET /api/media/api/v1/media-assets/{id}/transcripts`
- `GET /api/media/api/v1/media-assets/{id}/annotations`
- `GET /api/media/api/v1/media-assets/{id}/tags`
- `GET /api/media/api/v1/media-collections`
- `GET /api/media/api/v1/processing-jobs`
- `GET /api/media/api/v1/media-tags`

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

## Home Dashboard

The Home route includes:

- context count cards for organizations, workspaces, and projects
- workspace dashboard summary cards for work, docs, incidents, engineering, and AI
- module quick launch grid
- assistant shortcut
- workspace search shortcut
- favorites
- recently viewed items
- recently modified items
- system status placeholder
- global activity feed
- recent AI assistant conversations placeholder
- recent search results placeholder
- module status cards
- continue-where-you-left-off links
- cross-module links

## Platform Beta Integration

Current beta integration surfaces:

- global activity feed contract and frontend aggregation service
- notification center with unread count
- generic entity reference and cross-module links
- recently viewed and recently modified items
- favorites for common entities
- route-aware global search results with source/entity badges
- workspace settings sections for General, Members, Projects, Integrations, AI Preferences, and Notifications

These foundations are frontend-side and demo-ready. Backend aggregation, realtime notification delivery, and persisted user preferences are deferred.

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

- `/discover`: product discovery dashboard with idea, feature request, validated idea, roadmap, and high-impact idea cards.
- `/discover/ideas`: workspace-scoped ideas table with search, status filter, project filter, and create dialog.
- `/discover/ideas/[id]`: idea detail with overview, problem statement, target users, validation notes, impact placeholder, MVP plan, roadmap links, linked work placeholders, and optional AI idea analysis.
- `/discover/feature-requests`: feature request intake with search, status filter, and create dialog.
- `/discover/feedback`: feedback capture surface with source, author, sentiment, and create dialog.
- `/discover/roadmap`: Now/Next/Later roadmap board with create dialog.
- `/discover/validation`: focused view for ideas that need validation.
- `/discover/prioritization`: lightweight prioritization view for impact signals.

Discover UI uses the selected organization, workspace, and selected project where available. Impact scoring controls, validation note editing, roadmap drag-and-drop, and persisted cross-module links are deferred.

## Desk UI

Implemented first-pass Desk screens:

- `/desk`: service operations dashboard with open tickets, high-priority tickets, SLA risk, approvals, incidents, change requests, queue summary, SLA overview, and AI support suggestions.
- `/desk/tickets`: workspace-scoped ticket table with search, status, priority, queue, assignee filters, SLA signal, and create dialog.
- `/desk/tickets/[id]`: ticket detail with overview, requester, queue, SLA, approvals, comments, escalations placeholder, linked incident, and optional AI classification.
- `/desk/queues`: queue list with ticket count and owner/team placeholder plus create dialog.
- `/desk/slas`: SLA target list with response/resolution times plus create dialog.
- `/desk/approvals`: workspace approval queue aggregated from tickets with approve/reject placeholders.
- `/desk/incidents`: Desk-linked incident list.
- `/desk/change-requests`: operational change request list with create dialog.

Desk UI uses selected organization, workspace, and project context where available. SLA editing, full approvals workflows, change request detail screens, escalation timelines, and persisted queue ownership are deferred.

## Pulse UI

Implemented first-pass Pulse screens:

- `/pulse`: dashboard with alert, incident, and status page counts plus active incidents.
- `/pulse/alerts`: alert list with severity and status badges.
- `/pulse/incidents`: workspace-scoped incident table and create dialog.
- `/pulse/incidents/[id]`: incident detail with timeline, postmortem, and optional AI summary action.
- `/pulse/status-pages`: status page overview.
- `/pulse/on-call`: on-call schedule coverage.
- `/pulse/escalations`: escalation policy list.
- `/pulse/postmortems`: incident postmortem follow-up surface.

Pulse UI uses the selected workspace. Timeline event creation, status page component editing, on-call schedule editing, and realtime incident collaboration are deferred.

## Dev UI

Implemented first-pass Dev screens:

- `/dev`: dashboard with repository, deployment, release, and service catalog summaries.
- `/dev/repositories`: repository list with provider, branch, and project context.
- `/dev/pull-requests`: pull request review surface.
- `/dev/environments`: environment list.
- `/dev/deployments`: deployment list with environment, service, version, and status.
- `/dev/releases`: release list with status badges and optional AI release summary action.
- `/dev/services`: service catalog list with lifecycle status.
- `/dev/services/[id]`: service detail with owners and dependency sections.
- `/dev/dependencies`: dependency risk placeholder surface.

Dev UI uses the selected workspace. Repository creation, deployment mutation, service ownership editing, and dependency graph visuals are deferred.

## Collab UI

Implemented first-pass Collab screens:

- `/collab`: dashboard with thread, announcement, team update, and activity stream summaries.
- `/collab/threads`: thread list and create thread dialog.
- `/collab/threads/[id]`: thread detail with messages and message composer.
- `/collab/mentions`: mentions requiring attention.
- `/collab/announcements`: announcement list.
- `/collab/team-updates`: team update list.
- `/collab/activity`: activity stream view.

Collab UI uses the selected workspace and selected project where available. Realtime transport, reactions UI, mention creation, and rich-thread editing are deferred.

## Automation UI

Implemented first-pass Automation screens:

- `/automation`: dashboard with workflow, execution, and schedule summaries.
- `/automation/workflows`: workflow list with status badges.
- `/automation/workflows/[id]`: workflow detail with triggers, conditions, actions, and execution history.
- `/automation/executions`: execution history timeline/list.
- `/automation/schedules`: scheduled job list.
- `/automation/templates`: workflow template placeholders.
- `/automation/audit-logs`: automation audit log list.

Automation UI is read-only in this phase. Workflow creation, trigger/action editing, and real execution controls are deferred.

## Connect UI

Implemented first-pass Connect screens:

- `/connect`: dashboard with integrations, webhooks, sync jobs, and event subscription summaries.
- `/connect/integrations`: integration list and connector count.
- `/connect/connectors`: connector list.
- `/connect/webhooks`: webhook endpoint list plus recent delivery status.
- `/connect/sync-jobs`: sync job list with execution logs.
- `/connect/api-connections`: API connection list with connection status.
- `/connect/event-subscriptions`: event subscription list.

Connect UI is read-only in this phase. Real external connector setup, webhook retry controls, and credential management are deferred.

## Guard UI

Implemented first-pass Guard screens:

- `/guard`: dashboard with policies, reviews, compliance checks, and risk findings.
- `/guard/policies`: security policy list.
- `/guard/audit-events`: audit event table.
- `/guard/risks`: risk finding list with severity badges.
- `/guard/compliance`: compliance check list.
- `/guard/access-reviews`: access review list.
- `/guard/retention`: data retention policy list.
- `/guard/exceptions`: security exception list.

Guard UI is read-only in this phase. Policy authoring, review workflows, exception approvals, and compliance evidence uploads are deferred.

## Insights UI

Implemented first-pass Insights screens:

- `/insights`: dashboard with dashboard, metric, report, and insight event summaries.
- `/insights/dashboards`: dashboard card list and widget placeholder grid.
- `/insights/widgets`: widget planning surface.
- `/insights/reports`: reports table with status badges.
- `/insights/metrics`: metric snapshot cards and metric definition table.
- `/insights/usage`: usage metrics table.
- `/insights/events`: insight event feed.

Insights UI uses the selected workspace. Advanced charts, cross-service aggregation, scheduled report runs, and custom dashboard builders are deferred.

## Media UI

Implemented first-pass Media screens:

- `/media`: dashboard with media asset, collection, tag, and processing job summaries.
- `/media/assets`: asset list with media type badges.
- `/media/assets/[id]`: asset detail with transcripts, annotations, tags, and processing jobs.
- `/media/collections`: media collection list.
- `/media/processing-jobs`: processing job list with status badges.
- `/media/transcripts`: transcript readiness surface.
- `/media/annotations`: annotation placeholder surface.
- `/media/tags`: media tag list.

Media UI uses metadata only. File upload/storage, OCR, transcription, image understanding, and multimodal embeddings are deferred.

## Settings UI

Implemented settings foundation:

- `/settings`: settings overview
- `/settings/profile`: signed-in user display
- `/settings/workspace`: selected organization/workspace/project context
- `/settings/preferences`: theme toggle plus notification and compact-mode placeholders

Settings persistence beyond auth/workspace local storage is deferred.

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
- Discover impact scoring and validation note editing are placeholders beyond idea, request, feedback, and roadmap creation.
- Desk queue/SLA management is currently summary-focused; ticket comments are supported.
- Pulse status pages and postmortems are display-focused; incident creation is supported.
- Dev screens are read-mostly; release AI summary is optional and service ownership/dependency editing is deferred.
- Collab does not implement realtime, reactions, mentions, or rich text yet.
- Automation screens are read-only and do not execute workflows from the UI.
- Connect screens do not configure credentials or run external integrations yet.
- Guard screens are read-only and do not enforce policies from the frontend.
- Insights uses tables and metric cards only; advanced charts and analytics composition are deferred.
- Media uses metadata-only screens; upload, OCR, transcription, and multimodal processing are not implemented in the frontend yet.
- Settings preference storage is mostly placeholder-only beyond the existing auth and workspace stores.
- Memory has a navigation placeholder but no dedicated frontend route yet.

## Next Frontend Work

Planned frontend passes:

- Mutation/edit flows for Automation, Connect, Guard, Insights, and Media where the backend already supports them.
- Better lookup selectors for workspace/project/entity references.
- Rich editors, drag-and-drop boards, realtime collaboration, and advanced analytics charts.
- Full AI assistant integration into module-specific workflows.
- See `frontend/docs/product-experience-status.md` for the product experience status matrix.

## Frontend Docs

- `docs/frontend-status.md`
- `docs/navigation-architecture.md`
- `docs/ui-components.md`
- `docs/demo-guide.md`
- `docs/frontend-beta-status.md`
- `docs/component-map.md`
- `docs/platform-beta-guide.md`

## Future Module Integration

Future modules should plug into the shell by adding route-specific feature components under `src/features/` and shared API calls under `src/services/`. Business functionality should stay module-scoped while shared platform concerns remain in providers, stores, layouts, and common components.
