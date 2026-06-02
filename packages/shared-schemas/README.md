# Asthra Shared Schemas

`packages/shared-schemas` contains cross-service generic schemas for Asthra.

It only includes common response, pagination, health, readiness, service info, and status schemas. Business-specific request and response schemas remain owned by each service.

## Test

```bash
python -m pytest tests -q
```
