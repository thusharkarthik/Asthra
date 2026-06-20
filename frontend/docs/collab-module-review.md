# Collab Module Review

## Workflow

Collab now supports a lightweight team communication workflow:

- Create workspace/project-scoped threads with a topic.
- Browse and search threads.
- Open thread details with breadcrumbs, context metadata, messages, and a message composer.
- View thread overview, participants placeholder, linked resources placeholder, and archive placeholder.
- Create and list announcements.
- Review activity stream and team update pages from the existing module navigation.

## Routes

- `/collab`
- `/collab/threads`
- `/collab/threads/[id]`
- `/collab/announcements`
- `/collab/team-updates`
- `/collab/activity`
- `/collab/mentions`

## CRUD Status

- Threads: create, list, detail, search.
- Messages: create and list on thread detail.
- Announcements: create and list.
- Activity/team updates/mentions: list foundations.

## RBAC Readiness

Collab UI should eventually use:

- `collab.thread.view`
- `collab.thread.create`
- `collab.message.create`
- `collab.announcement.manage`

Current UI keeps the actions visible while backend/module permission wiring matures.

## Cross-Module Placeholders

Thread detail includes a linked resources section for future Flow work item, Docs page, Desk ticket, and Pulse incident relationships.

## Remaining Gaps

- Thread archive/update UI is not implemented yet.
- Archive action is visible as a disabled placeholder until backend thread archive support is added.
- Rich mentions, reactions, and realtime delivery are not implemented.
- Member names depend on future profile lookup across workspace membership.
