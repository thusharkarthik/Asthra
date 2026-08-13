# Asthra Shared Schemas

`packages/shared-schemas` contains cross-service generic schemas for Asthra services.

## Purpose

The package provides reusable schema models for common platform shapes:

- base success responses
- error responses
- pagination parameters and metadata
- health responses
- readiness responses
- service info responses
- generic status enums

## Response Schema Standards

Generic success responses use:

- `success`
- `data`
- `message`
- `request_id`

Generic error responses use:

- `success`
- `error.code`
- `error.message`
- `error.details`
- `request_id`

## Pagination Standards

Common pagination models include:

- `PaginationParams`
- `PaginationMeta`
- `PaginatedResponse`

List endpoints should keep `limit` and `offset` predictable, bounded, and documented.

## What Belongs Here

- Generic platform response schemas.
- Generic status enums shared by many services.
- Health/readiness/service metadata schemas.
- Generic pagination schemas.

## What Must Not Belong Here

- Business-specific schemas.
- Service-specific request models.
- Service-specific validation rules.
- Database models.
- Authorization policy rules.

Each service owns its own product schemas and API contracts. Shared schemas should remain generic and low-risk.
