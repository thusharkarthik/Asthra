# Connect Service Context

## Purpose

External Integrations.

## Owned Data

- Connectors
- OAuth Connections
- Webhooks
- External Systems

## Not Owned Data

- Users
- Automation rules
- Product module records

## APIs

- Connector CRUD
- OAuth connection records
- Webhook registration
- External system configuration

## Events Published

- IntegrationCreated
- IntegrationUpdated
- WebhookReceived

## Events Consumed

- Future automation trigger events
- Future platform events

## RBAC Rules

- Integration management must respect organization, workspace, and project scope.
- Secrets must not be exposed in frontend responses.

## UI Screens

- Connect Dashboard
- Integrations
- External Systems

## Future Roadmap

- Marketplace
- Integration Templates
