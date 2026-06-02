# Asthra Container Strategy

Asthra services are containerized independently. Containers should stay simple, reproducible, and service-owned.

## Current Standard

Each service should include:

- `Dockerfile`
- `.dockerignore`
- `requirements.txt`
- health endpoint
- readiness endpoint

## Local Runtime

Docker Compose maps each service container port `8000` to a unique host port.

The container-internal port can remain `8000` while host ports differ.

## Container Rules

- Do not bake secrets into images.
- Keep images service-specific.
- Prefer slim Python base images.
- Use explicit working directories.
- Store local SQLite files in mounted `/app/data` volumes.

## Future Work

- multi-stage builds if image size becomes a problem
- vulnerability scanning
- signed images
- deployment-specific runtime users
- Kubernetes probes
