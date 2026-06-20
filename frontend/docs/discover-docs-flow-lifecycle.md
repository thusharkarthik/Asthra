# Discover Docs Flow Lifecycle

## Purpose

This lifecycle pass connects the product delivery path:

Idea -> Validation -> Roadmap -> Documentation -> Execution

The goal is visible traceability without AI, agents, or silent automation.

## Relationship Model

Discover now owns a lightweight generic lifecycle relationship API.

Shape:

```json
{
  "source_type": "idea",
  "source_id": "1",
  "target_type": "doc_page",
  "target_id": "12",
  "relationship_type": "documents",
  "title": "Checkout requirements",
  "label": "Related document"
}
```

Supported entity types:

- `idea`
- `doc_page`
- `work_item`
- `roadmap_item`
- `sprint`
- `release`

Supported relationship types:

- `documents`
- `executes`
- `roadmaps`
- `references`
- `originates_from`
- `ships_in`

## API Endpoints

- `POST /api/v1/relationships`
- `GET /api/v1/relationships`
- `DELETE /api/v1/relationships/{relationship_id}`
- `GET /api/v1/relationships/lifecycle/ideas/{idea_id}`

The frontend reaches these through the API Gateway at `/api/discover/api/v1/relationships`.

## UI Behavior

Idea detail:

- Shows Related Documents, Related Work Items, and Related Roadmap Items.
- Allows manual linking to existing docs and work items by known id/title.
- Keeps Create Document and Create Flow Work Item as review-first actions.
- Convert Idea opens a four-step wizard: Create Documentation, Create Flow Structure, Review, Execute.

Docs page detail:

- Shows Related Ideas, Related Work Items, and Linked Releases.
- Allows manual linking/unlinking by known id/title.
- Keeps the Flow linked-entity payload visible for Flow-native links.

Flow work item detail:

- Uses existing Flow linked resources.
- Shows Origin Idea, Requirements Docs, Architecture Docs, Research Docs, and Related Docs.

Delivery view:

- Shows Idea -> Documents -> Work Items -> Sprint -> Release.
- Prefers persisted lifecycle relationships.
- Falls back to title-based matching when relationships are not populated.

## Placeholders vs Real Integration

Real now:

- Persist generic lifecycle relationships.
- List relationships by source or target entity.
- Delete relationships.
- Fetch an idea lifecycle graph.
- Show relationship-driven counts and links in the UI.

Still placeholder:

- Searchable cross-module pickers.
- Automatic Docs page creation from the conversion wizard.
- Automatic Flow hierarchy creation from the conversion wizard.
- Automatic sprint/release relationship creation.
- Deep synchronization between Flow native links and lifecycle relationships.

## Manual Test Flow

1. Create or open a Discover idea.
2. Open the idea detail page.
3. Use `Link Existing Document` with a known Docs page id/title.
4. Use `Link Existing Work Item` with a known Flow work item id/title.
5. Open `/discover/delivery` and confirm the idea shows document/work counts.
6. Open a Docs page and link an idea or work item.
7. Unlink a relationship and confirm the list updates.

## Remaining Gaps

- Relationship pickers need module search APIs.
- Flow linked resources and Discover lifecycle relationships should eventually be reconciled.
- Roadmap, sprint, and release relationships need richer write flows.
- RBAC enforcement should eventually protect relationship creation and deletion.
