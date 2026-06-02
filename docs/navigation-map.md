# Asthra Navigation Map

This is the future navigation plan. No frontend implementation exists yet.

## Global Shell

- workspace switcher
- project switcher
- global search
- notifications
- activity feed
- AI assistant panel
- user/profile menu

## Primary Modules

- Home
- Core
- Flow
- Docs
- AI
- Memory
- Discover
- Desk
- Pulse
- Dev
- Collab
- Automation
- Connect
- Guard
- Insights
- Media

## Navigation Hierarchy

Top-level navigation should expose suites. Secondary navigation should expose module-specific objects.

Examples:

- Flow: boards, backlog, work items, labels
- Docs: spaces, pages, tags, search
- Desk: tickets, queues, SLAs, incidents
- Pulse: alerts, incidents, on-call, status pages
- Insights: dashboards, metrics, reports

## Context Switching

Workspace and project context should be visible and persistent. Modules should respect the active context when filtering records.

## Future Search

Global search should start as gateway-backed keyword search and later include Memory/RAG-powered semantic search.
