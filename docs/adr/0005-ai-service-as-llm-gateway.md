# ADR 0005: AI Service as LLM Gateway

## Status

Accepted

## Context

Asthra is AI-native, but provider integrations, prompt templates, completions, and request logging need a clear owner. Letting each service talk directly to model providers would duplicate secrets, policy, logging, and cost controls.

## Decision

Use `ai-service` as the LLM gateway. It owns provider abstraction, prompt templates, conversations, completions, and request logs.

## Consequences

- AI provider access can be governed centrally.
- Product services can integrate AI later through a platform contract.
- Prompt and request metadata are easier to audit.
- `ai-service` is not responsible for document storage or retrieval ownership.
