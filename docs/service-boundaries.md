# Asthra Service Boundaries

Asthra services map to product and platform domains. Boundaries should stay clear as the platform grows.

## Platform Services

- `api-gateway`: frontend/client entry point and future policy enforcement layer.
- `core-service`: identity, organizations, workspaces, teams, roles, permissions, projects, and platform account primitives.
- `event-service`: event envelope storage, subscriptions, and future event backbone.
- `ai-service`: LLM provider gateway, prompts, conversations, and completions.
- `memory-service`: knowledge sources, documents, chunking, retrieval, and future embeddings/RAG.

## Product Services

- `flow-service`: work management.
- `docs-service`: knowledge/documentation.
- `discover-service`: product discovery and innovation planning.
- `desk-service`: service management.
- `pulse-service`: incident and reliability workflows.
- `dev-service`: engineering and DevOps visibility.
- `collab-service`: collaboration and async communication.
- `automation-service`: workflow definitions and future orchestration.
- `connect-service`: integrations and connectivity.
- `guard-service`: security, governance, and compliance.
- `insights-service`: analytics and reporting.
- `media-service`: media metadata and future multimodal processing.

## Boundary Rules

- Do not import another service's models.
- Do not depend on another service's database schema.
- Use the API gateway, direct internal APIs, or future events for cross-service interaction.
- Keep shared packages generic and free of service-specific domain rules.
