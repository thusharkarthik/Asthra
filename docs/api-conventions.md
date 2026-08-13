# Asthra API Conventions

Asthra APIs should be predictable, versioned, and consistent across services.

## Base Path

Service APIs use:

```text
/api/v1
```

System endpoints may live outside the prefix:

- `/health`
- `/ready`
- `/docs`

## REST Naming

- Use lowercase plural nouns for collections: `/projects`, `/work-items`, `/media-assets`.
- Use path IDs for specific resources: `/projects/{project_id}`.
- Use nested routes for subordinate resources: `/work-items/{work_item_id}/comments`.
- Use verbs only for explicit commands: `/api-keys/{api_key_id}/revoke`.

## Response Format

Standard success shape:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "request_id": "req-123"
}
```

Standard error shape:

```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  },
  "request_id": "req-123"
}
```

## Request IDs

Services should accept `X-Request-ID`. If missing, the entry service should generate one. Request IDs should propagate through service calls and future events.

## Gateway Routing

Frontend clients should eventually use API Gateway routes:

```text
/api/core/...
/api/flow/...
/api/docs/...
```

Direct service calls remain useful for local development and internal testing.
