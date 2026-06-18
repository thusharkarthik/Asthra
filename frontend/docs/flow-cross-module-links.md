# Flow Cross Module Links

## Purpose

Flow work items can now reference related Asthra entities without calling or synchronizing with other modules. This gives Flow a traceability layer for execution work while keeping service ownership boundaries intact.

## Link Model

Each linked resource is stored as a generic `LinkedEntity` record owned by Flow:

- `work_item_id`
- `entity_type`
- `entity_id`
- `entity_title`
- `entity_url` optional

Supported entity types:

- `work_item`
- `doc_page`
- `discover_idea`
- `desk_ticket`
- `pulse_incident`
- `dev_release`

The MVP stores the external entity ID and title manually. It does not validate the referenced entity against the owning service yet.

## API

Routes:

- `POST /api/v1/work-items/{id}/links`
- `GET /api/v1/work-items/{id}/links`
- `DELETE /api/v1/work-items/{id}/links/{link_id}`

Create payload:

```json
{
  "entity_type": "doc_page",
  "entity_id": "page-123",
  "entity_title": "Architecture Notes"
}
```

## Frontend Behavior

Work item detail pages show a `Linked Resources` section with grouped links:

- Documents
- Ideas
- Tickets
- Incidents
- Releases
- Related Work

Users can manually add and remove links. Board cards show lightweight indicators when a work item has document, idea, or incident links.

## Activity

Flow records activity for:

- `link_added`
- `link_removed`

These entries are local Flow activity records and are ready for a future platform-wide activity feed.

## Future Integration Strategy

Future passes can add lookup dialogs that query the owning services:

- Docs page search
- Discover idea picker
- Desk ticket picker
- Pulse incident picker
- Dev release picker

The link model should remain generic. Owning services should continue to own their entity data; Flow should store only the reference metadata needed for traceability.
