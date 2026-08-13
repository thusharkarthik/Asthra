# Platform Ownership

Asthra services have strict ownership boundaries.

## Ownership Principles

- A service owns its own data.
- Core owns identity, membership, scope, roles, and permissions.
- No service owns users except Core.
- Services may reference records from other services by ID.
- Services must not directly read or write another service database.

## Service Ownership

Core owns users, organizations, workspaces, projects, teams, roles, permissions, and memberships.

Flow owns work items, backlogs, sprints, boards, releases, dependencies, and capacity.

Discover owns ideas, feature requests, feedback, validation, prioritization, and roadmaps.

Docs owns spaces, pages, versions, and comments.

Desk owns tickets, incidents, service requests, and SLAs.

Pulse owns metrics, capacity, team health, and objectives.

Dev owns repositories, deployments, pipelines, and builds.

Connect owns integrations, OAuth connections, and webhooks.

Automation owns rules, triggers, actions, and workflow runs.

Insights owns dashboards, reports, and analytics.

Guard owns audit logs, security events, and compliance controls.

Collab owns conversations, mentions, reactions, and notifications.

Media owns files, attachments, and media metadata.

## Boundary Rule

When data appears to belong to two services, identify the source of truth first. The other service should reference or link to that record, not duplicate it.
