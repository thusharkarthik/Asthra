# Component Map

## Shell

- `layouts/asthra-shell.tsx`: protected shell, top nav, sidebar, assistant dock, search dialog, command palette
- `components/navigation/sidebar-nav.tsx`: grouped navigation
- `components/navigation/command-palette.tsx`: keyboard command launcher
- `components/search/search-dialog.tsx`: global workspace search
- `components/assistant/assistant-dock.tsx`: assistant panel

## Layout

- `components/layout/page-header.tsx`
- `components/layout/module-page-shell.tsx`
- `components/layout/ui-states.tsx`
- `components/dashboard/dashboard-card.tsx`

## Module Components

- `components/modules/module-dashboard-card.tsx`
- `components/modules/module-stats-grid.tsx`
- `components/modules/entity-table.tsx`
- `components/modules/detail-panel.tsx`
- `components/modules/*-badge.tsx`
- `components/modules/comment-list.tsx`
- `components/modules/comment-composer.tsx`
- `components/modules/config-json-viewer.tsx`

## API

- `services/api/client.ts`: request wrapper
- `services/api/errors.ts`: frontend API error parsing
- `services/api/*-api.ts`: typed module clients

## Stores

- `stores/auth-store.ts`
- `stores/workspace-store.ts`
- `stores/ui-store.ts`
- `stores/assistant-store.ts`
