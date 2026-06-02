# Asthra Pagination and Filtering

List endpoints should use simple `limit` and `offset` pagination during the foundation stage.

## Pagination Query Params

```text
?limit=100&offset=0
```

Recommended defaults:

- `limit`: 100
- `offset`: 0
- maximum `limit`: 500

## Pagination Metadata

Paginated responses should include:

- `limit`
- `offset`
- `count`
- `total` when known
- `has_next` when calculable
- `has_previous` when calculable

## Filtering

Filtering should use explicit query params:

```text
?workspace_id=1&status=active&created_by_id=10
```

Rules:

- Use snake_case query params.
- Keep filters service-owned and documented.
- Do not expose raw SQL or implementation-specific filter expressions.
- Use stable status values and enums where possible.
