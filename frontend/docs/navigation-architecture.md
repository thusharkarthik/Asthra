# Navigation Architecture

Asthra navigation is grouped by product area so the frontend reads as one platform instead of isolated modules.

## Sidebar Sections

- Platform: Home, Search, Assistant
- Work: Flow, Discover, Docs, Collab
- Operations: Desk, Pulse, Automation
- Engineering: Dev, Connect
- Intelligence: Insights, Memory placeholder
- Admin: Guard, Media, Settings

## Behavior

- Route links use active highlighting for exact and nested paths.
- Search and Assistant are sidebar actions, not routes.
- The desktop sidebar can collapse to icon-only mode.
- Compact mode persistence is intentionally deferred.

## Command Palette

The command palette opens with Ctrl+K or Cmd+K. It supports:

- Go to module commands
- Open Assistant
- Search Workspace

Command actions remain shell-local. They do not mutate backend services.
