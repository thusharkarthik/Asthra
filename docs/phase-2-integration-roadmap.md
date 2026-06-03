# Asthra Phase 2 Integration Roadmap

Phase 2 makes Asthra behave more like one connected platform without rushing into frontend, RAG, agents, or cache infrastructure.

## 1. API Gateway Expansion

- route all current service prefixes
- forward auth and request IDs
- expose service registry
- expose service health aggregation

## 2. Shared Package Adoption

- adopt shared helpers gradually
- start with gateway and new integration code
- avoid broad service rewrites

## 3. Event Publishing Adoption

- publish selected high-value events
- use no-op mode when Event Service is unavailable
- keep failures non-blocking in the MVP

## 4. Cross-Service Auth Propagation

- forward `Authorization` through API Gateway
- keep Core as source of truth
- add downstream current-user context later

## 5. Real RAG Implementation

- connect Docs/Memory/Event Service
- publish document/page events
- implement embeddings and vector storage later

## 6. AI Feature Integration

- keep AI Service as LLM gateway
- integrate product features after event/auth foundations are stable

## 7. Frontend Foundation

- build frontend shell after gateway routes and auth flow stabilize
- use API Gateway as client entry point

## 8. Cache/Performance Layer Later

- introduce Redis/cache only after routing, auth, events, and frontend needs are clear
- avoid premature cache complexity
