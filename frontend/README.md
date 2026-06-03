# Asthra Frontend

Asthra Frontend is the platform shell for future Asthra modules. It provides layout, navigation, workspace context, API client foundations, state stores, theme support, global search UI, and the AI assistant dock.

This foundation does not implement module-specific business screens yet.

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
- `/docs`
- `/discover`
- `/desk`
- `/pulse`
- `/dev`
- `/collab`
- `/automation`
- `/insights`
- `/settings`

`/login` and `/register` are public. All platform shell routes are protected and redirect unauthenticated users to `/login`.

All module routes are placeholders. The Home route shows real core-service counts where available and keeps placeholder module cards for the next frontend phase.

## Environment

Create `frontend/.env.local` when running against local services:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8010
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
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8010
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

## Future Module Integration

Future modules should plug into the shell by adding route-specific feature components under `src/features/` and shared API calls under `src/services/`. Business functionality should stay module-scoped while shared platform concerns remain in providers, stores, layouts, and common components.
