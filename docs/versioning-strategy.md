# Asthra Versioning Strategy

Asthra APIs use explicit path versioning.

## API Versions

Current API prefix:

```text
/api/v1
```

## Rules

- Breaking API changes require a new version path.
- Additive fields can remain in the same version.
- Service docs must list active endpoints and version assumptions.
- Deprecated endpoints should be documented before removal.

## Service Versions

Each service also exposes service metadata through:

```text
/api/v1/system/info
```

The response should include service name, version, environment, and API prefix or version.

## Gateway Versioning

API Gateway routes should preserve downstream API versioning instead of hiding it. A gateway route may look like:

```text
/api/core/api/v1/projects
```

Future gateway route normalization can be decided by ADR.
