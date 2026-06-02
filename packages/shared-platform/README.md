# Asthra Shared Platform

`packages/shared-platform` contains lightweight reusable standards for Asthra services.

This package defines common helpers for:

- response envelopes
- error objects and exceptions
- request IDs
- logging
- service metadata
- pagination

It does not contain business logic and is not wired into existing services yet.

## Test

```bash
python -m pytest tests -q
```
