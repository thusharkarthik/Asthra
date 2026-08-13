# Asthra Shared Auth

`packages/shared-auth` contains lightweight auth utilities for downstream Asthra services.

Core Service remains the source of truth for authentication, user identity, roles, permissions, and token validation. This package does not validate JWT signatures, does not call Core Service, and does not contain secrets.

## Included Helpers

- JWT claim parsing without verification.
- Bearer token extraction and auth header forwarding.
- Lightweight current user context model.
- Service-to-service auth placeholders.
- Simple role and permission checks.

## Test

```bash
python -m pytest tests -q
```
