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

## API Gateway

Frontend traffic should go through the API Gateway. The gateway routes requests but does not own service business logic.
