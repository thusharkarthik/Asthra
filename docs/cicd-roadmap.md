# Asthra CI/CD Roadmap

Current GitHub Actions workflows are placeholders only. They document the intended pipeline shape without performing real deployment work.

## Current Placeholders

- `.github/workflows/lint.yml`
- `.github/workflows/test.yml`
- `.github/workflows/build.yml`

These workflows are manually triggered and do not deploy.

## Future Pipeline Stages

1. lint
2. unit tests
3. package tests
4. service tests
5. Docker image builds
6. security scans
7. stage deployment
8. production deployment with approval

## Rules

- Pull requests should run tests before merge.
- Deployments should use environment-specific config.
- Production deploys should require explicit approval.
- CI should avoid calling real AI providers or external integrations.
