# Asthra Shared Platform Standards

`packages/shared-platform` defines common service helpers for response envelopes, errors, request IDs, logging, service metadata, and pagination.

This package is not wired into existing services yet. Services should adopt it gradually in later hardening work to avoid risky endpoint refactors.

## Response Format

Standard success response:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "request_id": "req-123"
}
```

Use `success_response(data, message, request_id)`.

## Error Format

Standard error response:

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

Use `error_response(code, message, request_id, details)`.

## Error Utilities

Shared exceptions:

- `AsthraError`
- `NotFoundError`
- `ValidationError`
- `PermissionDeniedError`
- `ConflictError`

These errors expose `code`, `status_code`, `message`, and optional `details`.

## Request ID Standard

Services should read `X-Request-ID` when provided and generate one when missing.

Helpers:

- `generate_request_id()`
- `get_request_id_from_headers(headers)`
- `RequestIdASGIMiddleware`

The request ID should be returned in response payloads and headers where middleware is adopted.

## Logging Standard

Logging should be simple and service-friendly:

- timestamp
- level
- logger/module name
- message

Helpers:

- `configure_logging(level="INFO")`
- `get_logger(name)`

Future work can extend this with request ID context and structured JSON logs.

## Service Metadata

Use `build_service_info(app_name, app_version, environment, api_version)` for `/system/info` style endpoints.

Standard fields:

- `service`
- `version`
- `environment`
- `api_version`

## Pagination Standard

Use `normalize_limit_offset()` to clamp pagination inputs.

Use `pagination_metadata()` or `paginated_response()` to return:

- `limit`
- `offset`
- `count`
- `total`
- `has_next`
- `has_previous`

## Adoption Plan

Later service hardening should:

1. Add `asthra-shared-platform` to each service dependency list.
2. Replace local response helpers where safe.
3. Replace local request ID middleware where safe.
4. Use shared pagination helpers on list endpoints.
5. Keep business behavior unchanged during migration.
