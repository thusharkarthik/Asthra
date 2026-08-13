# UI Testing Guide

## Startup

Run the platform:

```bash
docker compose up --build
```

Open the frontend at `http://localhost:3000`.

## CRUD Walkthrough

1. Register and sign in.
2. Use Settings to establish organization, workspace, and project context.
3. Seed Flow demo data if you want a realistic project:

```bash
cd services/flow-service
FLOW_DEMO_WORKSPACE_ID=2 FLOW_DEMO_PROJECT_ID=3 python3 scripts/seed_flow_defaults.py
```

4. Open Home and confirm the setup guide disappears once context exists.
5. Create a Flow work item.
6. Open `/flow/boards`, filter by assignee/sprint/release/priority, and move a card.
7. Open a Flow work item, edit fields, add a comment, and review audit history.
8. Create a Docs space and page.
9. Create Discover ideas, Desk tickets, Pulse incidents, Automation workflows, Connect integrations, Insights dashboards, and Media assets where the UI exposes create actions.
10. Open `/platform/crud-checklist` and compare manual results with the readiness matrix.

## Flow E2E Foundation

The Flow Playwright template is available at:

```text
frontend/e2e/flow-demo.spec.ts.example
```

The frontend package does not install Playwright yet. To enable the template later:

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
mv e2e/flow-demo.spec.ts.example e2e/flow-demo.spec.ts
npx playwright test e2e/flow-demo.spec.ts
```

## Expected Feedback

- Required fields should block submission.
- Create actions should show a loading label.
- Successful creates should show toast feedback where the shared form system is adopted.
- API failures should remain visible without crashing the shell.

## Known Gaps

- Delete/archive actions are placeholders in several modules.
- Some modules have list-first MVP screens rather than full edit dialogs.
- Advanced AI and agent workflows are intentionally deferred.
