# API Gateway Context

## Purpose

Platform routing and service entrypoint.

## Owned Data

- Service registry configuration
- Gateway route definitions
- Gateway health metadata

## Not Owned Data

- Users
- Product module business records
- Permissions
- Service databases

## APIs

- Gateway proxy routes
- Service health aggregation
- Service registry views

## Events Published

- None by default

## Events Consumed

- None by default

## RBAC Rules

- Forward authentication and request context.
- Do not become the source of business authorization rules.

## UI Screens

- No direct UI screens

## Future Roadmap

- Service discovery
- Gateway observability
- Rate limiting
- Policy hooks
