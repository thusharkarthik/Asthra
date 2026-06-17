# Flow Hierarchy And Dependencies

## Overview

Flow now supports a lightweight work hierarchy and dependency model for planning without adding sprint, roadmap, or drag-and-drop complexity yet.

## Hierarchy Levels

Supported levels:

- Initiative
- Feature
- Work Item
- Subtask

Hierarchy rules:

- Initiatives are top-level planning containers.
- Features can belong to initiatives.
- Work items can belong to initiatives or features.
- Subtasks must belong to work items.

## Frontend Surfaces

New Flow routes:

- `/flow/hierarchy`
- `/flow/dependencies`

Updated Flow routes:

- `/flow/work-items/[id]`
- `/flow/boards`
- `/flow/backlog`

The hierarchy page shows a nested tree and allows creating initiatives, features, work items, and subtasks. The dependencies page lets users connect existing work items with simple relation types.

## Dependency Types

Supported relation types:

- `blocks`
- `blocked_by`
- `related_to`
- `duplicate_of`

Dependencies are read-only indicators in boards/backlog today. They are not yet used for scheduling, critical path analysis, or automated warnings.

## Detail Page Behavior

Work item detail pages now include:

- Hierarchy context
- Child/subtask list
- Add subtask action
- Related work list
- Add relation action
- Remove relation action

Cross-module links remain placeholders until platform references are persisted.

## Manual Test Steps

1. Open `/flow/hierarchy`.
2. Create an Initiative.
3. Create a Feature under the Initiative.
4. Create a Work Item under the Feature.
5. Add a Subtask under the Work Item.
6. Open the Work Item detail page and confirm the subtask is visible.
7. Open `/flow/dependencies`.
8. Select a source and target work item.
9. Add a `blocks` relation.
10. Confirm the relation appears on the dependency page and the source work item detail page.

## Remaining Gaps

- No drag-and-drop hierarchy editing yet.
- No visual dependency graph yet.
- No cycle detection beyond self-reference prevention.
- No automatic scheduling impact from dependencies.
- No cross-module dependency references yet.
