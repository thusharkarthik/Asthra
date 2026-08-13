# Asthra Git Workflow

Asthra uses a simple branch workflow for platform foundation work.

## Branches

- `main`: stable repository state.
- `develop`: integration branch when active.
- `feature/*`: focused feature or foundation work.
- `fix/*`: focused bug fixes.
- `docs/*`: documentation-only updates.

## Flow

1. Create a focused branch.
2. Keep changes scoped to the task.
3. Run relevant tests before opening a PR.
4. Update docs when structure, API, or standards change.
5. Merge after review.

## Merge Strategy

Prefer squash merges for small focused branches. Preserve meaningful PR titles and descriptions so history remains readable.

## Tag Strategy

Use tags for meaningful platform milestones, not every small internal change.

Example:

```text
v0.1.0-foundation
```
