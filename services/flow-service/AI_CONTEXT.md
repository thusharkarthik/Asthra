# Flow Service Context

## Purpose

Execution and delivery management.

## Owned Data

- Work Items
- Hierarchy
- Backlog
- Sprints
- Boards
- Releases
- Dependencies
- Capacity

## Not Owned Data

- Users
- Organizations
- Workspaces
- Projects
- Teams
- Docs pages
- Discover ideas
- Desk tickets
- Pulse incidents

## APIs

- Work item CRUD
- Board views
- Sprint and release planning
- Dependencies
- Capacity and time tracking
- Search and saved views

## Events Published

- WorkItemCreated
- WorkItemUpdated
- WorkItemCompleted
- SprintStarted
- SprintCompleted
- ReleaseCreated

## Events Consumed

- Future Docs link events
- Future Discover conversion events
- Future Core membership events

## RBAC Rules

- Use Flow permission codes such as `flow.workitem.create`, `flow.workitem.edit`, `flow.sprint.manage`, and `flow.release.manage`.
- Resolve identity, membership, and scope through Core.

## UI Screens

- Flow Dashboard
- Work Items
- Boards
- Backlog
- Sprints
- Releases
- Capacity
- Search
- Reports

## Future Roadmap

- Sprint Planning
- Release Readiness
- Workflow Engine
- Advanced Reporting
