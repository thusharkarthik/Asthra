# API Standards

Asthra APIs should be predictable, versioned, and consistent across services.

## Direction

- Use FastAPI for backend HTTP services.
- Prefix public APIs with a version such as `/api/v1`.
- Use Pydantic request and response schemas.
- Return structured validation errors.
- Use JWT authentication once auth is implemented.
- Keep authorization checks explicit at service boundaries.

## Response Shape

APIs should prefer clear resource models over transport-specific shortcuts. Pagination, filtering, sorting, and error formats should be standardized before broad API implementation begins.

No API routes are implemented in the current tier.
