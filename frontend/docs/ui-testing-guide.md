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
3. Open Home and confirm the setup guide disappears once context exists.
4. Create a Flow work item.
5. Create a Docs space and page.
6. Create Discover ideas, Desk tickets, Pulse incidents, Automation workflows, Connect integrations, Insights dashboards, and Media assets where the UI exposes create actions.
7. Open `/platform/crud-checklist` and compare manual results with the readiness matrix.

## Expected Feedback

- Required fields should block submission.
- Create actions should show a loading label.
- Successful creates should show toast feedback where the shared form system is adopted.
- API failures should remain visible without crashing the shell.

## Known Gaps

- Delete/archive actions are placeholders in several modules.
- Some modules have list-first MVP screens rather than full edit dialogs.
- Advanced AI and agent workflows are intentionally deferred.
