# Discover Docs Flow Lifecycle

## Purpose

This lifecycle pass connects the product delivery path:

Idea -> Validation -> Roadmap -> Documentation -> Execution

The goal is visible traceability without AI, agents, or silent automation.

## Relationship Model

Discover owns both concrete execution link tables and a generic lifecycle relationship API.

Concrete tables:

- `discover_doc_links`
- `discover_flow_links`
- `doc_flow_links`

Direct traceability columns:

- `ideas.docs_page_id`
- `ideas.flow_epic_id`
- `pages.discover_idea_id`

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
- `POST /api/v1/ideas/{idea_id}/generate-specification`
- `POST /api/v1/feature-requests/{feature_request_id}/generate-specification`
- `POST /api/v1/ideas/{idea_id}/create-epic`
- `GET /api/v1/ideas/{idea_id}/execution-links`
- `GET /api/v1/delivery/pipeline`
- `POST /api/v1/pages/{page_id}/flow-work-items`
- `GET /api/v1/pages/{page_id}/flow-work-items`

The frontend reaches these through the API Gateway at `/api/discover/api/v1/relationships`.

## UI Behavior

Idea detail:

- Shows Related Documents, Related Work Items, and Related Roadmap Items.
- `Generate Specification` creates a real Docs page and stores the link.
- `Create Epic` creates a real Flow epic and stores the link.
- Allows manual linking to existing docs and work items by known id/title.
- Convert Idea opens a four-step wizard: Create Documentation, Create Flow Structure, Review, Execute.

Docs page detail:

- Shows Related Ideas, Related Work Items, and Linked Releases.
- Can create linked Flow Epics, Stories, and Tasks.
- Allows manual linking/unlinking by known id/title.

Flow work item detail:

- Uses existing Flow linked resources.
- Shows Origin Idea, Requirements Docs, Architecture Docs, Research Docs, and Related Docs.

Delivery view:

- Shows Ideas -> Specifications -> Epics -> Stories -> Tasks -> Completed.
- Reads persisted lifecycle pipeline data.
- Does not use placeholder or title-matched records.

## Placeholders vs Real Integration

Real now:

- Persist generic lifecycle relationships.
- Generate Docs specifications from Discover ideas and feature requests.
- Create Flow epics from Discover ideas.
- Create Flow Epics, Stories, and Tasks from Docs pages.
- Store concrete link rows for Discover/Docs/Flow traceability.
- List relationships by source or target entity.
- Delete relationships.
- Fetch an idea lifecycle graph.
- Show relationship-driven counts and links in the UI.

Still placeholder:

- Searchable cross-module pickers.
- Automatic sprint/release relationship creation.
- Deep synchronization between Flow native links and lifecycle relationships.

## Manual Test Flow

1. Create or open a Discover idea.
2. Open the idea detail page.
3. Click `Generate Specification` and open the generated Docs page.
4. Click `Create Epic` and open the generated Flow work item.
5. Open a Docs page and create a Story or Task.
6. Open `/discover/delivery` and confirm the pipeline counts update.
7. Use manual link/unlink for existing records where lookup APIs are still pending.

## Remaining Gaps

- Relationship pickers need module search APIs.
- Flow linked resources and Discover lifecycle relationships should eventually be reconciled.
- Roadmap, sprint, and release relationships need richer write flows.
- RBAC enforcement should eventually protect relationship creation and deletion.
