# Asthra Frontend Demo Guide

This guide covers a local beta demo of the Asthra frontend shell.

## Start

```bash
docker compose up --build frontend api-gateway core-service
```

Open `http://localhost:3000`.

## Demo Flow

1. Sign in or register through the frontend.
2. Select organization, workspace, and project context from the top bar.
3. Open Home and review:
   - workspace summary
   - module quick launch
   - assistant shortcut
   - workspace search shortcut
   - recent activity placeholders
   - module status cards
4. Use the sidebar sections to move across modules.
5. Press `Ctrl+K` or `Cmd+K` to open the command palette.
6. Open global search and try a workspace query.
7. Open the assistant panel and ask a workspace-scoped question.
8. Visit Flow, Docs, Discover, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media dashboards.
9. Open Settings, Profile, Workspace, and Preferences.

## Demo Notes

- Many module lists depend on backend data.
- Some dashboard cards use placeholders where cross-service aggregation is not ready.
- Assistant and search require API Gateway routes plus ai-service/memory-service data for full behavior.
- No agents, realtime updates, drag-and-drop, file uploads, or advanced analytics are implemented yet.
