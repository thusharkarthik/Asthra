# Asthra Platform Context

This file is the source of truth for Asthra platform architecture, ownership boundaries, lifecycle, conventions, and development standards.

## Asthra Vision

Asthra is an Execution Operating System.

The platform helps organizations:

- Discover opportunities
- Build knowledge
- Plan work
- Execute delivery
- Manage operations
- Monitor health
- Automate workflows
- Govern execution

Asthra is inspired by:

- Jira
- Confluence
- ServiceNow
- ClickUp
- Linear

Asthra is not a clone. Asthra focuses on connecting the entire execution lifecycle into a unified platform.

## Platform Hierarchy

```text
Platform
 └── Organization
      └── Workspace
           └── Project
                └── Team
                     └── Member
```

## Platform Lifecycle

```text
Discover
    ↓
Docs
    ↓
Flow
    ↓
Dev
    ↓
Desk
    ↓
Pulse
    ↓
Insights
```

Everything begins as an opportunity.

Opportunities become:

- Ideas
- Knowledge
- Work
- Releases
- Operations
- Metrics
- Reports

Asthra is an execution operating system.

## Architecture

Frontend:

- React
- TypeScript
- TanStack Router
- TanStack Query

Backend:

- FastAPI Microservices

Infrastructure:

- API Gateway
- PostgreSQL
- Redis (future)
- Event Bus (future)

## Service Ownership

Core owns:

- Users
- Organizations
- Workspaces
- Projects
- Teams
- Roles
- Permissions
- Memberships

Flow owns:

- Work Items
- Backlogs
- Sprints
- Boards
- Releases
- Dependencies
- Capacity

Discover owns:

- Ideas
- Feature Requests
- Feedback
- Validation
- Prioritization
- Roadmaps

Docs owns:

- Spaces
- Pages
- Versions
- Comments

Desk owns:

- Tickets
- Incidents
- Service Requests
- SLAs

Pulse owns:

- Metrics
- Capacity
- Team Health
- Objectives

Dev owns:

- Repositories
- Deployments
- Pipelines
- Builds

Connect owns:

- Integrations
- OAuth Connections
- Webhooks

Automation owns:

- Rules
- Triggers
- Actions
- Workflow Runs

Insights owns:

- Dashboards
- Reports
- Analytics

Guard owns:

- Audit Logs
- Security Events
- Compliance

Collab owns:

- Conversations
- Mentions
- Reactions
- Notifications

Media owns:

- Files
- Attachments
- Media Metadata

## Development Rules

- Never duplicate ownership between services.
- Always use Core as the source of truth for identity, membership, scope, and permissions.
- No service may directly own users except Core.
- Services may reference Core IDs but must not duplicate Core identity data.
- Services communicate through APIs.
- Services must not share databases directly.
- Future platform coordination should use events.
- Respect RBAC everywhere.

All screens must support:

- Organization Scope
- Workspace Scope
- Project Scope

## Current Platform Priority

1. Flow Maturity
2. Discover Maturity
3. Docs Maturity
4. Desk
5. Pulse
6. Dev

## Service Context Files

Each service contains an `AI_CONTEXT.md` file documenting:

- Purpose
- Owned Data
- Not Owned Data
- APIs
- Events Published
- Events Consumed
- RBAC Rules
- UI Screens
- Future Roadmap

## Constraints

Platform context documentation must not change:

- APIs
- Database schema
- Business logic
- Routes
- UI functionality
