# Core Invitations Certification

Date: 2026-08-15
Status: Bug fixes added after manual QA found invite create/accept/decline regressions; browser recertification required.

## Purpose

Certify and harden Core invitations across platform, organization, and workspace scopes before continuing broader Core enterprise certification. Invitations are a membership and role-assignment entry point, so they must not bypass scoped RBAC, assign roles at the wrong scope, or grant unrelated access.

This pass does not change navigation/sidebar behavior, God Mode, bottom bar scope display, feature flag defaults, or RBAC permission codes.

## Current Invitation Architecture

Backend-owned files:

- `services/core-service/app/models/invitation.py`
- `services/core-service/app/schemas/invitation.py`
- `services/core-service/app/repositories/invitation_repository.py`
- `services/core-service/app/services/invitation_service.py`
- `services/core-service/app/api/v1/invitations.py`

Frontend-owned files inspected/updated:

- `frontend/src/components/settings/settings-admin-views.tsx`
- `frontend/src/services/api/settings-api.ts`
- `frontend/src/hooks/use-settings-mutations.ts`
- `frontend/src/types/core.ts`

Model fields:

- `email`
- optional `organization_id`
- optional `workspace_id`
- `invited_by_id`
- optional `role_id`
- `status`
- `token`
- `expires_at`
- timestamps

Supported invitation scopes in v1:

- platform invite: `organization_id = null`, `workspace_id = null`
- organization invite: `organization_id` set, `workspace_id = null`
- workspace invite: `organization_id` and `workspace_id` set

Project invitations are not a dedicated Core invitation flow today. Project membership is managed separately through project member APIs.

## Backend API Behavior

Endpoints:

- `POST /api/v1/invitations`
- `GET /api/v1/invitations`
- `GET /api/v1/invitations/{invitation_id}`
- `POST /api/v1/invitations/{invitation_id}/accept`
- `POST /api/v1/invitations/{invitation_id}/accept-in-app`
- `POST /api/v1/invitations/{invitation_id}/resend`
- `POST /api/v1/invitations/{invitation_id}/decline-in-app`
- `POST /api/v1/invitations/{invitation_id}/revoke`

Create behavior:

- Requires an active authenticated user.
- Lowercases invite email.
- Validates organization/workspace existence and active state.
- Validates workspace belongs to the provided organization.
- Requires `settings.member.invite` at platform, organization, or workspace scope based on the payload.
- Rejects duplicate pending invites for the same email/scope with `409`.
- Existing users are auto-accepted into the requested scope.
- New/unregistered users remain pending until accepted by an authenticated user with the same email.
- Tokens are generated with `token_urlsafe(32)` and expire after 7 days.
- Context access version is bumped for the invite scope.
- Activity is logged as `member.invited`.

Accept behavior:

- Requires authentication.
- Requires token match for `/accept`.
- `/accept-in-app` skips token entry but still requires authenticated same-email user.
- Requires pending status.
- Expired invitations are marked `expired` and rejected.
- Current user's email must match invitation email.
- Accepted organization invites create organization membership and an organization-scoped role assignment when a role is provided.
- Accepted workspace invites create workspace membership, ensure parent organization membership, ensure parent `organization_member` role assignment, and create the workspace-scoped role assignment when a role is provided.
- Accepted platform invites assign the platform role when a role is provided.
- Activity is logged as `member.invitation_accepted`.
- Inviter receives an `invitation.accepted` notification.
- Context access version is bumped for the invitation scope.

Resend/cancel behavior:

- Resend requires `settings.member.resend` at invitation scope and only works for pending invitations.
- Resend regenerates token and expiry, logs `member.invitation_resent`, and bumps access version.
- Revoke/cancel requires `settings.member.cancel` at invitation scope and only works for pending invitations.
- Cancel marks status `cancelled`, logs `member.invitation_cancelled`, and bumps access version.
- Cancelled, expired, and accepted invitations cannot be accepted or resent.

## Hardening Added

`InvitationService` now validates that an invitation role matches the actual invitation scope:

| Invitation payload | Allowed role scope |
|---|---|
| platform invite | `platform` |
| organization invite | `organization` |
| workspace invite | `workspace` |

Invalid combinations return `400` before the invitation can create a role assignment. Token accept and in-app accept also re-check the stored invitation role against the stored invitation scope before writing memberships/assignments. This protects both newly-created invitations and any pre-existing malformed invitation rows.

The existing platform-role authority guard remains: non-superuser platform role assignment through invitations requires an active platform owner/admin assignment. Ordinary organization/workspace admins cannot invite users into platform roles because platform roles are rejected outside platform scope before assignment.

## Frontend Invite UI Behavior

Inspected Settings member invite flows:

- Global Settings -> Members shows platform-scoped roles only.
- Organization-scoped member pages default and lock organization scope from the route.
- Workspace-scoped member pages default and lock workspace scope from the route.
- Workspace choices in organization context are filtered to the selected/route organization.
- Platform/Superuser roles are hidden in scoped org/workspace member invite flows through visible-role filtering.
- Invite success/error toasts are present.
- Duplicate invite errors bubble from backend messages.
- Invite/resend/cancel mutations invalidate invitations, settings member data, roles/permissions/context, and platform context.

Small frontend fix in this pass:

- Invite modal role choices now mirror the invitation API and show only platform, organization, and workspace roles. Project/team roles are no longer selectable from the Core invitation modal because the current invitation schema has no `project_id` or `team_id` target.
- `settingsApi.createInvitation(...)` now accepts `organization_id: number | null`, matching platform-scope invite payloads without using an `any` cast.

## Manual QA Bug Fix Update — 2026-08-15

Manual QA after the first certification pass found that invite creation could persist side effects but surface as an Internal Server Error to the UI, causing the frontend mutation to take the error path and skip member/invitation cache refresh. Core logs showed the create failure at `InvitationRepository.add_memberships()` with `sqlite3.IntegrityError: UNIQUE constraint failed: role_assignments.user_id, role_assignments.role_id, role_assignments.scope_type, role_assignments.scope_id`. The repository checked only active assignments before inserting, but stale/inactive assignments still collide with the database uniqueness rule. Existing-user auto-accepted invitations also produced actionable `invitation.pending` notifications, so the invited user saw Accept/Decline buttons for an already-accepted invite. Decline used the admin revoke endpoint, which requires member-cancel authority and is not valid for a normal invited user.

Fixes added:

- Invitation membership assignment now reactivates stale same user/role/scope `role_assignments` instead of inserting duplicates.
- Invitation create now refreshes the ORM invitation after final commit before response serialization.
- Accept, in-app accept, and cancel also refresh before returning.
- Existing-user auto-accepted invites now create `invitation.accepted` notifications, not actionable pending notifications.
- In-app accept updates the invitee's pending notification to `invitation.accepted`, marks it read, and invalidates frontend notification/member/context caches.
- Added `POST /api/v1/invitations/{invitation_id}/decline-in-app` for invited users to decline pending invitations without member-management permissions.
- In-app decline updates invitation status to `declined`, logs `member.invitation_declined`, notifies the inviter, updates the invitee's pending notification to `invitation.declined`, and does not create membership or role assignment.
- Frontend Notification Center now calls `declineInvitationInApp(...)` instead of admin revoke for invited-user decline.

Certification status remains manual-QA pending until browser tests confirm invite create success toast, automatic member/invite list refresh, accept, decline, and duplicate pending behavior.

## Permission And Scope Matrix

| Operation | Backend authority |
|---|---|
| Create platform invite | `settings.member.invite` at platform |
| Create organization invite | `settings.member.invite` at organization |
| Create workspace invite | `settings.member.invite` at workspace |
| List invitations | Superuser sees all; non-superuser sees invitations joined through org membership |
| Get invitation detail | Superuser or user with access to invitation org/workspace/platform scope |
| Resend invitation | `settings.member.resend` at invitation scope |
| Cancel invitation | `settings.member.cancel` at invitation scope |
| Accept invitation | authenticated same-email invited user with valid pending token or in-app pending invite |

Invitation role assignment source remains `role_assignments`. No new `user_roles` usage was added.

## Existing-User Invite Behavior

Existing registered users are auto-accepted at invite creation time:

- Organization invite creates `OrganizationMember` and the requested organization-scoped `RoleAssignment`.
- Workspace invite creates `WorkspaceMember`, ensures parent `OrganizationMember`, ensures parent organization `organization_member` assignment, and creates the requested workspace-scoped `RoleAssignment`.
- Existing active members in the same scope are rejected with `409`.
- Re-invite after removal is safe because stale accepted duplicate invitation rows are deleted before creating the new accepted invite.
- Existing users receive a non-actionable `invitation.accepted` notification because they are auto-accepted at invite creation time.

## New-User Invite / Invite-Led Onboarding

New/unregistered email invite behavior:

- Invitation remains `pending`.
- No user account is created automatically.
- No email is sent by Core today.
- After the user registers normally and authenticates with the same email, they can accept through token accept or in-app accept if they have an invitation notification.
- Wrong token returns `400`.
- Wrong authenticated user/email returns `403`.
- Expired invitation is marked `expired` and rejected.
- Used/cancelled/expired invites cannot be reused.

Invite-led onboarding is therefore partial in v1: Core stores and accepts pending invitations, but it does not yet own public email delivery or a public token landing flow that creates the account from the invite.

## Notification / Email Behavior

Notifications:

- Existing-user auto-accepted invite creates a non-actionable `invitation.accepted` notification for the invited user.
- Pending invite accept creates an `invitation.accepted` notification for the inviter.
- Notifications do not grant permissions or mutate role assignments.

Email:

- No email delivery service is implemented for invitations in Core today.
- Resend regenerates the token/expiry but does not send an email.
- Future email integration should consume the existing token/status lifecycle without changing RBAC behavior.

## Audit / Activity Coverage

| Action | Activity status |
|---|---|
| Invite created | logged as `member.invited` |
| Invite accepted | logged as `member.invitation_accepted` |
| Invite resent | logged as `member.invitation_resent` |
| Invite cancelled | logged as `member.invitation_cancelled` |
| Invite expired | status changes to `expired`, but no dedicated activity row is logged |
| Invite declined | logged as `member.invitation_declined` |
| Invite rejected | not implemented |

Known producer gap: expiration is a status transition without a dedicated audit/activity producer. There is no admin approval/reject flow today.

## Test Matrix

Backend fixture added:

`services/core-service/tests/test_invitations_certification.py`

Coverage:

- unauthenticated create/list/detail/accept/in-app accept/in-app decline/resend/revoke rejected
- user without invite permission cannot invite
- authorized org admin cannot invite into unrelated org/workspace
- existing-user organization invite creates org membership, org role assignment, notification, and activity
- stale same user/role/scope assignments are reactivated instead of causing duplicate `role_assignments` inserts
- existing-user workspace invite creates workspace access and parent org membership/assignment
- pending duplicate invite returns `409`
- resend changes token and keeps status pending
- cancel changes status to cancelled and prevents later accept/resend
- accept requires correct token and matching authenticated email
- accepted invite cannot be reused
- expired invite marks status expired and rejects acceptance
- invalid role/scope combinations are rejected
- rejected invite attempts do not mutate role assignments
- access version bumps for intended invite scope only
- accepted invite does not grant permissions outside intended scope
- invited user can decline pending invite without member-management permission

Existing related coverage remains in:

- `services/core-service/tests/test_members_invitations.py`
- `services/core-service/tests/test_member_role_lifecycle_certification.py`
- `services/core-service/tests/test_notifications_certification.py`
- `services/core-service/tests/test_access_control_enforcement.py`

## Validation

Attempted:

- `cd services/core-service && pytest tests/test_invitations_certification.py -vv` blocked because local `pytest` is not installed.
- `cd services/core-service && pytest tests/test_member_role_lifecycle_certification.py -vv` blocked because local `pytest` is not installed.
- `cd services/core-service && pytest tests/test_app_imports.py -vv` blocked because local `pytest` is not installed.
- `cd frontend && ./node_modules/.bin/tsc --noEmit` blocked because `frontend/node_modules` is not installed.

Fallback passed:

- In-memory Python syntax compile passed for `app/repositories/invitation_repository.py`.
- In-memory Python syntax compile passed for `app/services/invitation_service.py`.
- In-memory Python syntax compile passed for `app/api/v1/invitations.py`.
- In-memory Python syntax compile passed for `tests/test_invitations_certification.py`.

Final whitespace/status validations are recorded in the session note for this pass.

## Manual QA Checklist

1. Login as Superuser/Platform Owner.
2. Open Organization -> Members.
3. Invite a new test email to organization with Organization Member role.
4. Confirm success feedback.
5. Confirm member list refreshes.
6. Confirm duplicate/reinvite behavior is safe.
7. Invite existing user if supported.
8. Confirm role/membership assignment is correct.
9. Try workspace invite if UI supports it.
10. Confirm workspace scope is locked/filtered.
11. Try project invite if UI supports it.
12. Confirm project invite is not exposed through the Core invitation modal in v1.
13. Login as unauthorized/view-only user.
14. Confirm invite button hidden or backend request denied.
15. Confirm platform/Superuser roles are not selectable by ordinary admins.
16. Accept invite as the matching invited user.
17. Confirm invite cannot be reused.
18. Confirm expired/cancelled invites cannot be accepted.
19. Confirm no unrelated roles/permissions were granted.
20. Confirm notifications/audit logs if supported.

## Known Gaps

- No email delivery for invitations.
- No public invite landing/signup flow owned by Core.
- Project/team invitations are not supported by the Core invitation schema; project membership is managed separately.
- No dedicated invite management inbox/page.
- No invite reject endpoint; invited-user decline exists as `decline-in-app`, but no admin approval/inbox workflow exists.
- Expiry status transition does not produce a dedicated activity row.
- No invite rate limiting, domain restrictions, or allow/block lists.
- Invitation list visibility for non-superusers is based on organization membership join and should be revisited if workspace-only invitation management becomes broader.

## Go / No-Go Criteria

Go for continued Core certification when:

- Targeted invitation tests pass in a dependency-complete environment.
- Manual QA confirms org/workspace invite success and role/scope filtering.
- Manual QA confirms wrong-scope role attempts are rejected by the backend.
- Manual QA confirms pending/cancel/resend/accept status behavior.

No-go for expanding invite-led onboarding if:

- Any invite can assign a role outside its intended scope.
- Platform/Superuser roles can be assigned from org/workspace flows.
- Cancelled/expired/accepted invites can be reused.
- Notifications or invite reads mutate RBAC state.
