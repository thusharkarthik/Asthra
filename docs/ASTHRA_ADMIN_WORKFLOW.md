# Asthra Admin Workflow

## Setup Order

1. Create an organization.
2. Create a workspace under that organization.
3. Create projects under the workspace.
4. Invite members by email from Settings -> Members.
5. Assign scoped Asthra roles.
6. Use project-specific modules such as Flow.

## Role Catalog

Asthra roles are grouped by scope:

- Platform: Platform Owner, Platform Admin, Platform Support
- Organization: Organization Owner, Organization Admin, Organization Auditor
- Workspace: Workspace Admin, Workspace Manager, Workspace Member, Workspace Viewer
- Project: Project Admin, Project Manager, Project Contributor, Project Viewer
- Team: Team Lead, Team Member, Team Observer
- Functional: Product Owner, Scrum Master, Engineering Manager, Release Manager, Incident Commander, Knowledge Manager

Every role has a stable key, scope, description, and placeholder permission preset. The preset is a contract for future full RBAC enforcement.

## Inviting Members

Admins invite users by email. If the email belongs to an existing Asthra user, core-service adds the membership directly and marks the invitation accepted. If the email is unknown, core-service creates a pending invitation.

Pending invitations can be resent or cancelled. Duplicate pending invitations for the same email and scope are rejected.

## Invitation Notifications

When an existing user is invited, core-service creates an in-app notification. If the user does not exist yet, the pending invitation remains stored. After signup/login with the same email, core-service syncs the pending invite into that user's notification center.

Notification actions currently show Accept and Decline placeholders. Direct notification-action endpoints are a future improvement.

## Safety Rules

- The last Organization Owner cannot be removed.
- The last Organization Owner cannot be downgraded.
- Workspace owner protection follows the same pattern.
- Platform roles can only be assigned by Platform Owner/Admin users or superusers.
- Viewer roles should not see member or role management actions in the UI.

## Current Limitations

- Role-based UI visibility exists as a frontend foundation.
- Full backend RBAC across every service is not implemented yet.
- Project-scoped membership is still a future model.
- Last active timestamps display `Not tracked yet` until activity tracking is connected.
- Permission presets are placeholders and not a complete permission matrix yet.
