# Platform Integration

Asthra platform integration connects module experiences through shared frontend contracts and future backend integration points.

## Activity Strategy

Activity items use a common contract:

- actor
- action
- entity reference
- timestamp
- source service

Current frontend aggregation is mock-backed. Future backend aggregation should use event-service and module APIs.

## Notification Strategy

Notifications support:

- work item updates
- comments
- mentions
- incidents
- approvals
- AI assistant notifications

Current notification delivery is in-app and static/persisted in browser storage. Future delivery should use event-service plus polling or realtime transport.

## Cross-Module Navigation

Entity references provide:

- source
- entity type
- entity ID
- title
- href

These references allow flows like:

- Idea to Work Item
- Ticket to Incident
- Release to Incident
- Thread to Work Item
- Flow item to Docs page

## Recent Items and Favorites

Recent and favorite items use the same generic entity reference model. Current storage is local browser persistence. Future persistence should live behind backend user preference APIs.

## Search Integration

Global search results render source badges, entity badges, and route-aware links. Result quality depends on memory-service indexing.
