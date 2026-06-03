# Asthra API Gateway Routing

The API Gateway is the future frontend and client entry point. Phase 2 expands routing coverage across all current Asthra services while keeping gateway behavior simple.

## Supported Proxy Routes

| Gateway Route | Downstream Service |
| --- | --- |
| `/api/core/{path}` | core-service |
| `/api/flow/{path}` | flow-service |
| `/api/docs/{path}` | docs-service |
| `/api/ai/{path}` | ai-service |
| `/api/memory/{path}` | memory-service |
| `/api/discover/{path}` | discover-service |
| `/api/desk/{path}` | desk-service |
| `/api/pulse/{path}` | pulse-service |
| `/api/dev/{path}` | dev-service |
| `/api/collab/{path}` | collab-service |
| `/api/automation/{path}` | automation-service |
| `/api/connect/{path}` | connect-service |
| `/api/guard/{path}` | guard-service |
| `/api/insights/{path}` | insights-service |
| `/api/media/{path}` | media-service |
| `/api/events/{path}` | event-service |

## Forwarding Rules

The proxy forwards:

- HTTP method
- path
- query parameters
- raw request body, including JSON bodies
- `Authorization`
- `X-Request-ID`
- `Content-Type` when present

The gateway does not validate authentication yet. It only forwards `Authorization`.

## Health Aggregation

`GET /api/gateway/health/services` checks each configured service health endpoint and returns an aggregate status.

Tests mock downstream calls; they do not require services to be running.

## Future Routing Work

- auth validation
- normalized auth context forwarding
- route policies
- rate limiting
- service discovery
- cache/performance layer integration
