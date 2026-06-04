# Activity System

The Activity System provides a unified feed for platform actions across modules.

## Contract

Activity item fields:

- `id`
- `source`
- `actor`
- `action`
- `entity`
- `timestamp`

Entity reference fields:

- `source`
- `entity_type`
- `entity_id`
- `title`
- `href`
- `description`

## Sources

Supported beta sources:

- Core
- Flow
- Docs
- Discover
- Desk
- Pulse
- Dev
- Collab
- Automation

## API Gateway Endpoint

- `GET /api/platform/activity`

The endpoint returns an aggregated activity contract. Current beta data is seeded/in-memory at the gateway layer.

## Future Backend Direction

Activity should eventually be backed by event-service records, module event publishing, and user/workspace filtering.
