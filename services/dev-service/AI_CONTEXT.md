# Dev Service Context

## Purpose

Engineering Operations.

## Owned Data

- Repositories
- Deployments
- Builds
- Pipelines
- Environments

## Not Owned Data

- Users
- Flow releases
- Pulse incidents
- Connect credentials

## APIs

- Repository views
- Deployment views
- Release views
- Environment views
- Service catalog

## Events Published

- ReleaseCreated
- ReleaseDeployed
- DeploymentStarted
- DeploymentCompleted

## Events Consumed

- Future Flow release planning events
- Future Pulse incident events

## RBAC Rules

- Use Dev permission codes such as `dev.release.view` and `dev.release.manage`.
- Resolve identity, membership, and scope through Core.

## UI Screens

- Dev Dashboard
- Repositories
- Deployments
- Releases
- Services

## Future Roadmap

- Git Integrations
- Release Tracking
- Environment Management
