# Asthra Shared Auth

`packages/shared-auth` provides lightweight authentication utilities for downstream Asthra services.

Core Service remains the source of truth for authentication, user identity, roles, permissions, and token validation. This package does not validate JWT signatures, does not call Core Service, and does not contain secrets.

## Purpose

Shared Auth helps services consistently:

- extract bearer tokens from `Authorization` headers
- forward auth headers to downstream services
- parse JWT claims without verification for lightweight context
- represent current user context
- check simple roles and permissions
- prepare for future service-to-service auth

## Authorization Header Forwarding

Downstream services should preserve the incoming auth header when forwarding requests:

```python
from shared_auth import forward_auth_headers

headers = forward_auth_headers(request.headers)
```

Only the `Authorization` header is forwarded by this helper.

## JWT Parsing

Helpers:

- `decode_jwt_without_verification(token)`
- `extract_claims(token)`
- `extract_subject(token)`

These helpers do not verify token signatures. They are only for reading claims from a token that another trusted layer has already accepted or forwarded.

## Current User Context

`CurrentUserContext` is a lightweight dataclass:

- `user_id`
- `email`
- `organization_id`
- `workspace_id`
- `roles`
- `permissions`

This is a transport/context helper, not a source of truth.

## Permission Helpers

Helpers:

- `has_role(user_context, role)`
- `has_permission(user_context, permission)`
- `has_any_permission(user_context, permissions)`

These are simple list checks. Real authorization policy enforcement remains future work.

## Service-to-Service Auth Roadmap

Current helpers:

- `build_service_token_placeholder()`
- `validate_service_token_placeholder()`

These are placeholders only. Future service auth should use signed service identity tokens, key rotation, service registry trust configuration, and audit logging.

## Gateway Auth Validation Roadmap

Future API Gateway work should:

1. Validate incoming user JWTs against Core Service or a shared trust configuration.
2. Forward normalized auth context to downstream services.
3. Preserve `Authorization` for services that need direct Core validation.
4. Add service-to-service tokens for internal calls.
5. Keep Core Service as the identity source of truth.
