# Asthra

Asthra is an AI-native operating platform for work, engineering, knowledge, automation, collaboration, and intelligent workflows.

Asthra is an original platform with its own architecture, suite model, workflows, and AI-first direction. The current repository stage is focused on monorepo structure and documentation only.

## Current Priority

- Level 0: repository structure.
- Level 1: documentation, architecture files, and engineering standards.
- Level 2 next: FastAPI core service foundation.

Backend services, RAG, agents, automation runtime, and AI features are not implemented in this stage.

## Monorepo Layout

```text
apps/             User-facing web applications.
services/         Backend service boundaries.
packages/         Shared reusable packages.
infrastructure/   Docker, nginx, deployment, and monitoring assets.
docs/             Product, architecture, API, database, and engineering docs.
scripts/          Developer and operational scripts.
```

## Suite Areas

Asthra includes Core, Flow, Docs, Discover, Desk, Dev, Pulse, Intelligence, Automate, Insights, Connect, Guard, Memory, Collab, and Media. These areas are represented as service boundaries now, with implementation deferred until the roadmap reaches each tier.
