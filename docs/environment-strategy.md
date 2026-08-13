# Asthra Environment Strategy

Asthra uses environment-specific configuration while keeping service behavior consistent across environments.

## Environments

- `local`: Docker Compose, SQLite volumes, developer machines
- `dev`: shared development environment for integration testing
- `stage`: production-like validation environment
- `prod`: production environment

## Configuration Rules

- Environment variables define service metadata and connection URLs.
- Secrets must not be committed.
- `.env.example` files document required settings only.
- Production secrets should come from a managed secret store later.

## Current Local Pattern

Current services use:

- `APP_NAME`
- `APP_VERSION`
- `ENVIRONMENT`
- `API_V1_PREFIX`
- `DATABASE_URL`
- `ASTHRA_CORS_ORIGINS`

## Future Environment Work

- managed secret storage
- Terraform-managed infrastructure
- Kubernetes namespaces per environment
- Helm value files per environment
- deployment promotion checks
