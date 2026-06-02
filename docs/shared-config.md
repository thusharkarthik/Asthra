# Asthra Shared Config

`packages/shared-config` provides lightweight configuration helpers for Asthra services.

## Purpose

The package standardizes common environment parsing and service metadata construction:

- string environment lookup
- required environment checks
- boolean parsing
- integer parsing
- comma-separated list parsing
- secret masking
- service config creation

## Environment Variable Standards

Services should keep these common variables:

- `APP_NAME`
- `APP_VERSION`
- `ENVIRONMENT`
- `API_V1_PREFIX`
- `DATABASE_URL`
- `ASTHRA_CORS_ORIGINS`

Environment parsing should be explicit and predictable. Missing required values should fail early.

## Secret Handling Rules

- Do not hardcode secrets in code.
- Do not log raw secrets.
- Use `mask_secret()` before including sensitive values in diagnostics.
- `.env.example` files should use placeholders or empty values.
- Real secret management is future infrastructure work.

## Service Config

Use `ServiceConfig` or `build_service_config()` to represent common service metadata:

- `app_name`
- `app_version`
- `environment`
- `api_prefix`
- `debug`
- `database_url`

## Adoption Plan

Services can adopt this package later by:

1. Adding `asthra-shared-config` as a local dependency.
2. Replacing local env parsing helpers where safe.
3. Keeping current service config names stable.
4. Avoiding business behavior changes during adoption.

This package should remain lightweight and infrastructure-focused.
