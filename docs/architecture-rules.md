# Architecture Rules

## Core Ownership

Core owns identity.

Core is the source of truth for:

- Users
- Membership
- Scope
- Roles
- Permissions

No service owns users except Core.

## Service Boundaries

- No direct database sharing.
- Services communicate through APIs.
- Future architecture uses events for cross-service coordination.
- Ownership boundaries must be respected.

## Data References

Services may store IDs from other services when needed for relationships or scope. Storing an ID does not transfer ownership of the referenced record.

## RBAC

- Users receive roles.
- Roles contain permissions.
- Permissions drive access.
- Services must not assign permissions directly to users.

## Context Versioning

Core owns platform context versions for organizations, workspaces, projects, and access state.

- Context versions change when scope records change.
- Access versions change when memberships, role assignments, roles, or permissions change.
- Frontend clients should call the lightweight context version endpoint before refetching full context payloads.
- Matching versions mean cached platform context can be reused.
- Changed versions should invalidate only affected query keys.

Future Redis or event-bus infrastructure can replace polling with pushed version changes.

## API Gateway

Frontend traffic should go through the API Gateway. The gateway routes requests but does not own service business logic.
