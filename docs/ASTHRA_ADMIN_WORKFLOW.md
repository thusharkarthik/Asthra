# Asthra Admin Workflow

Asthra requires a basic hierarchy before project-scoped modules become useful:

1. Organization: top-level account boundary.
2. Workspace: collaboration and operational boundary inside an organization.
3. Project: project-level scope used by Flow and other modules.

Frontend settings now supports the internal alpha setup flow:

- Create organization.
- Create workspace under organization.
- Create project under workspace.
- Select the created context in the shell.
- Use Flow with the selected project.

The current implementation calls core-service through the API Gateway and keeps advanced security, billing, audit, and policy behavior out of scope.

