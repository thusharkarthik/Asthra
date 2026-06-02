# Asthra Architecture Principles

Asthra is built as a modular, AI-native operating platform. The architecture favors clear service ownership, stable contracts, and staged platform maturity.

## Core Rules

- Each service owns its domain, data model, and API surface.
- No service may directly read or write another service database.
- `core-service` is the source of truth for identity, organizations, workspaces, memberships, roles, and projects.
- `api-gateway` is the future entry point for frontend and external client traffic.
- `event-service` is the future platform event backbone.
- `ai-service` is the LLM gateway for provider access and prompt/conversation foundations.
- `memory-service` owns chunking, retrieval, embeddings lifecycle, and future RAG memory.
- Shared packages provide common infrastructure helpers, not business behavior.

## Modularity

Services should be independently understandable and testable. Shared code belongs in `packages/` only when it is generic and cross-service.

## Staged Maturity

The current platform intentionally uses local SQLite, simple Docker Compose, placeholder event delivery, and foundation APIs. Production infrastructure such as broker-backed events, cache layers, gateway enforcement, and RAG pipelines comes later.

## Contract First

Services should communicate through APIs, future events, and documented contracts. Data ownership boundaries matter more than short-term convenience.
