# Product Usability Pass

This pass makes Asthra easier to exercise from the UI before advanced AI work resumes.

## Improvements

- Added a shared setup guide for missing organization, workspace, and project context.
- Added reusable form primitives for required labels, field help, cancel actions, submit loading states, and error display.
- Added app-level toast feedback for user-visible create and validation outcomes.
- Added a shared detail layout with metadata, activity, linked entities, and danger-zone placeholders.
- Added `/platform/crud-checklist` for internal demo and CRUD-readiness tracking.

## CRUD Readiness

Flow and Docs are the strongest manual CRUD paths today. Discover, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media have broad list and create surfaces, with update/delete still staged for follow-up.

## Remaining UX Gaps

- Finish edit dialogs across all major entities.
- Add archive/delete confirmation flows where backend APIs support them.
- Improve table filtering consistency beyond Flow and Discover.
- Add route-level breadcrumbs after the main CRUD flow is stable.

## Next Step Before AI

Run the manual flow in `docs/demo-data-guide.md`, capture broken create/update/delete paths, and close the highest-friction CRUD gaps before adding new AI features.
