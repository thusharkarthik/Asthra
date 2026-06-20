# Platform Linking

## Purpose

Asthra modules can now share a common operational relationship model through the API Gateway platform layer. This keeps Flow, Docs, Discover, Desk, Collab, and Pulse connected without forcing every service to duplicate relationship storage immediately.

## Relationship Model

Relationship fields:

- `id`
- `source_type`
- `source_id`
- `target_type`
- `target_id`
- `relationship_type`
- `created_by`
- `created_at`

Supported entity types:

- `flow_work_item`
- `docs_page`
- `discover_idea`
- `desk_ticket`
- `collab_thread`
- `pulse_incident`

Supported relationship types:

- `relates_to`
- `blocks`
- `references`
- `originates_from`
- `documents`
- `supports`
- `duplicates`

## APIs

Platform routes:

- `GET /api/platform/relationships`
- `POST /api/platform/relationships`
- `DELETE /api/platform/relationships/{relationship_id}`
- `GET /api/platform/relationships/entity/{entity_type}/{entity_id}`
- `GET /api/platform/activity`
- `GET /api/platform/search`

The API keeps legacy `from`, `to`, and `relation` response fields for existing UI compatibility while exposing the generic relationship fields.

## Linked Resources Panel

The shared `LinkedResourcesPanel` is used on:

- Flow work item detail
- Docs page detail
- Discover idea detail
- Desk ticket detail
- Collab thread detail
- Pulse incident detail

Users can manually link an existing entity by type, ID, title, and relationship type. Lookup-backed selection can be added later without changing the relationship API.

## Activity Model

The global `/activity` page reads platform activity from `GET /api/platform/activity` and displays actor, action, entity, and time across modules.

## Search Model

The global `/search` page uses `GET /api/platform/search` with:

- `q`
- `module`
- `entity_type`

It searches the platform entity references currently known through activity, recent items, favorites, and relationships.

## Current Limits

- The relationship store is API Gateway in-memory state for local/demo readiness.
- Service-owned persistent relationship tables can adopt the same contract later.
- Linked resource creation is manual ID/title entry until module lookup APIs are standardized.
