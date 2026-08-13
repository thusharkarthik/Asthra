# Asthra AI Architecture Principles

Asthra is AI-native, but AI capability is introduced in stages.

## Current Rules

- `ai-service` is the LLM gateway.
- Existing product services must not directly hardcode provider integrations.
- No service should implement agents, RAG, or automation execution unless the current tier explicitly calls for it.
- Prompt templates, provider abstraction, conversations, and request logs belong in `ai-service`.

## Future Direction

AI capabilities should be exposed through stable service contracts and governed by security, audit, and cost controls.

## Separation of Concerns

- `ai-service`: model/provider access and AI request lifecycle.
- `memory-service`: retrieval context, chunks, embeddings, and memory lifecycle.
- `automation-service`: workflow definitions and future orchestration.
- `guard-service`: governance and policy visibility.
