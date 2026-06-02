# Asthra Shared Package Adoption Status

Phase 2 starts adoption without broad service rewrites.

## Current Adoption

| Area | Status |
| --- | --- |
| API Gateway responses | Uses `shared-platform` response helpers when installed, with local fallback |
| API Gateway request IDs | Uses `shared-observability` request ID generation when installed, with local fallback |
| API Gateway auth forwarding | Uses `shared-auth` header forwarding when installed, with local fallback |
| API Gateway config parsing | Uses `shared-config` list env parsing when installed, with local fallback |
| Event publishing | Selected services use `shared-events` when installed, with no-op fallback |

## Selected Service Event Adoption

- core-service
- flow-service
- docs-service
- ai-service
- memory-service

## Pending Services

- discover-service
- desk-service
- pulse-service
- dev-service
- collab-service
- automation-service
- connect-service
- guard-service
- insights-service
- media-service

## Adoption Rules

- Shared packages must remain optional until packaging/install strategy is finalized.
- Service behavior must not depend on Event Service being available.
- Avoid broad refactors just to adopt shared utilities.
- Prefer adopting shared packages in actively touched files.
