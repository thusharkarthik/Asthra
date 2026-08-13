# Platform Flows

Asthra Platform Beta connects module screens through shared entity references, activity, notifications, search, recent items, and favorites.

## Core Demo Flow

1. User signs in through core-service.
2. User selects organization, workspace, and project context.
3. Home dashboard shows workspace summary, activity, favorites, recent items, and cross-module links.
4. User opens global search and navigates to a matching entity.
5. User opens notification center and follows a notification.
6. User reviews related entities through cross-module links.
7. User checks `/platform/health` for gateway and service readiness.

## Cross-Module Examples

- Idea to Work Item
- Work Item to Docs Page
- Ticket to Incident
- Incident to Release
- Thread to Work Item

## Current Integration Mode

The API Gateway exposes platform beta endpoints for aggregation contracts. Frontend falls back gracefully to demo data when endpoints are unavailable.

## Deferred

- realtime notification delivery
- event-service-backed activity stream
- persisted user preference APIs
- production RAG
- agents
