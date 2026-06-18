# Demo Data Guide

Use this guide to validate Asthra from the frontend after `docker compose up --build`.

## Manual Test Flow

1. Register a user from `/register`.
2. Sign in from `/login`.
3. Open Settings, then create or select an organization.
4. Create or select a workspace.
5. Create or select a project.
6. Open Flow and create a work item.
7. Open Docs and create a space, then create a page.
8. Open Discover and create an idea.
9. Open Desk and create a ticket.
10. Open Pulse and create an incident.
11. Review Home, global search, notification center, assistant placeholder, favorites, and `/platform/crud-checklist`.

## Suggested Sample Values

- Organization: `Acme Demo`
- Workspace: `Platform Demo`
- Project: `Alpha Readiness`
- Work item: `Prepare onboarding checklist`
- Docs space: `Engineering`
- Docs page: `Deployment Guide`
- Idea: `Customer portal`
- Ticket: `Login issue from pilot customer`
- Incident: `API latency investigation`

## Current Limits

- Some update and delete flows are still placeholders.
- Advanced AI, agents, realtime, production RAG, and cache are intentionally not part of this pass.
- Use the CRUD checklist page to track which module surfaces are ready for manual demo testing.
