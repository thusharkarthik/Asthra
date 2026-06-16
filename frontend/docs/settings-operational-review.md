# Settings Operational Review

## Before State

Settings was a lightweight placeholder for profile, workspace context, preferences, and notifications. It did not provide the administrative setup path needed before using project-scoped modules like Flow.

## After State

Settings now acts as the operational admin center:

- Create and list organizations.
- Create and list workspaces under organizations.
- Create and list projects under workspaces.
- Update the frontend organization/workspace/project selector context after successful creates.
- Review organization and workspace members.
- Create teams, roles, permissions, and API keys through existing core-service APIs.
- Open detail pages for organizations, workspaces, and projects.
- Show placeholders for security, audit logs, AI preferences, and integrations without introducing backend scope.

## Remaining Gaps

- Member invitations and role assignment are review-first placeholders.
- Delete/archive flows are intentionally guarded with danger-zone placeholders.
- API key copy behavior is basic and should be improved before production use.
- Security and audit settings need Guard integration later.

