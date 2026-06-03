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

All module routes are placeholders. The Home route includes mock dashboard cards.

## Local Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
cd frontend
npm test
```

Current tests cover:

- shell rendering
- sidebar rendering
- home dashboard rendering

## API Foundation

`src/services/api/client.ts` prepares requests for the future API Gateway.

Defaults:

```text
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8010
```

The request wrapper adds:

- `Content-Type`
- `X-Request-ID`
- optional `Authorization`

## State Stores

- `auth-store`: placeholder user/token state
- `workspace-store`: mock workspace/project context
- `ui-store`: assistant/search panel state
- `assistant-store`: mock assistant conversations

## Future Module Integration

Future modules should plug into the shell by adding route-specific feature components under `src/features/` and shared API calls under `src/services/`. Business functionality should stay module-scoped while shared platform concerns remain in providers, stores, layouts, and common components.
