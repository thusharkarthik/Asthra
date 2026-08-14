# Core Member / Role Assignment Lifecycle Certification

Date: 2026-08-15
Status: Certification coverage added; runtime QA still required in a dependency-complete local app.

## Purpose

Certify how users gain, change, and lose scoped access across Organization, Workspace, and Project scopes. This pass is certification/stabilization only. It does not change navigation/sidebar behavior, God Mode, bottom bar scope display, feature flag defaults, or RBAC permission codes.

## Architecture Found

Core-owned access data:

- `role_assignments` is the source of truth for scoped roles and effective access.
- `organization_members`, `workspace_members`, `project_memberships`, and `team_members` are supporting membership/listing records.
- `user_roles` remains legacy/backward-compatibility data and was not expanded by this pass.
- Effective permissions are resolved by `AccessControlService` from active role assignments plus membership fallback only when an active matching role assignment exists.

Primary backend files:

- `app/models/user.py`
- `app/models/organization.py`
- `app/models/workspace.py`
- `app/models/project.py`
- `app/services/scoped_membership_service.py`
- `app/services/membership_service.py`
- `app/services/invitation_service.py`
- `app/services/role_service.py`
- `app/services/access_control_service.py`
- `app/api/v1/role_assignments.py`
- `app/api/v1/organizations.py`
- `app/api/v1/workspaces.py`
- `app/api/v1/projects.py`
- `app/api/v1/invitations.py`

## Backend Behavior

### Invite / Add Existing Member

`InvitationService.create(...)` handles invitations through `POST /api/v1/invitations`.

- Requires `settings.member.invite` at platform, organization, or workspace scope depending payload.
- Pending duplicate invitations return `409`.
- Existing users are auto-accepted into the requested org/workspace scope.
- Organization invite creates `OrganizationMember` plus org-scoped `RoleAssignment` when a role is provided.
- Workspace invite creates `WorkspaceMember`, ensures parent `OrganizationMember`, ensures org `organization_member` assignment, and creates the workspace-scoped assignment when a role is provided.
- Re-invite after removal is safe because stale accepted duplicate invitations are deleted before creating the new invitation.

Project-specific invite is not a separate flow in v1. Project membership is managed through `/projects/{project_id}/members`.

### Role Assignment

`ScopedMembershipService.create_role_assignment(...)` handles direct scoped role assignment through `POST /api/v1/role-assignments`.

- Requires `settings.role.manage` at the target scope.
- Creates or reactivates an active `role_assignments` row.
- Rejects duplicate active assignment with `409`.
- Rejects platform roles outside platform scope.
- Hidden Superuser assignment requires Superuser/Platform Owner authority.
- Assignment creates supporting org/workspace membership rows where needed.
- Access versions are bumped for the affected scope.
- Activity is logged as `role.assigned`.

### Role Assignment Reads

This pass hardened `ScopedMembershipService.list_role_assignments(...)`.

- Superuser can list all assignments.
- Non-superusers only receive their own assignments or assignments in scopes where they have `settings.role.view`.
- Generic assignment list reads no longer expose every platform assignment to any active user.

### Role Removal / Last Role Removal

`DELETE /api/v1/role-assignments/{assignment_id}` revokes the assignment.

- Requires `settings.role.manage` at the assignment scope.
- Blocks Superuser self-removal through the route-level guard.
- Blocks removing the last active Superuser or Platform Owner assignment where protected-role logic applies.
- Removing one ordinary scoped role removes only that assignment.
- Removing the last ordinary role in an org/workspace scope removes the supporting membership/access instead of silently assigning a fallback role.
- Access versions are bumped and activity is logged as `role.revoked`.

### Member Removal / Descendant Revocation

`MembershipService.remove_organization_member(...)`:

- Requires `settings.member.remove` at organization scope.
- Deletes the organization membership.
- Revokes active organization role assignments for that org.
- Revokes descendant workspace, project, and team role assignments under that org.
- Deletes descendant workspace member rows and inactivates descendant project/team memberships.
- Leaves unrelated organization/workspace/project assignments untouched.
- Bumps access versions and logs `member.removed`.

`MembershipService.remove_workspace_member(...)`:

- Requires `settings.member.remove` at workspace scope.
- Deletes the workspace membership.
- Revokes workspace assignments and descendant project/team assignments under that workspace.
- Inactivates descendant project/team memberships.
- Preserves parent organization access if the user still has an active organization role assignment.
- Bumps access versions and logs `member.removed`.

Project member removal inactivates the project membership and bumps project access version. It does not currently revoke separate project-scoped `role_assignments`; that should be reviewed if project role assignment and project membership are both used together in a future UI path.

## Permission Matrix

| Operation | Backend authority |
|---|---|
| Invite platform member | `settings.member.invite` at platform |
| Invite organization member | `settings.member.invite` at organization |
| Invite workspace member | `settings.member.invite` at workspace |
| Remove organization member | `settings.member.remove` at organization |
| Remove workspace member | `settings.member.remove` at workspace |
| Add/update/remove project member | project manage/edit authority through scoped membership service |
| Assign role | `settings.role.manage` at target scope |
| Remove role assignment | `settings.role.manage` at assignment scope |
| List role assignments | own assignments or `settings.role.view` at assignment scope |
| Assign platform role | platform `settings.role.manage`; platform roles must be platform-scoped |
| Assign hidden Superuser role | Superuser / Platform Owner authority |

## Effective Permission Rules

- Multiple active role assignments union permissions.
- Organization assignments inherit to child workspaces/projects/teams.
- Workspace assignments inherit to child projects/teams.
- Project assignments apply only to the project scope.
- Team assignments apply only to the team scope.
- No active scoped role means no active scoped access from membership fallback rows.
- Superuser bypass remains handled by `AccessControlService`.

## Frontend Settings Behavior Checked

Inspected:

- `frontend/src/components/settings/settings-admin-views.tsx`
- `frontend/src/services/api/settings-api.ts`
- `frontend/src/hooks/use-settings-mutations.ts`

Confirmed:

- Global Settings -> Members uses the global users endpoint and active role assignments for role display.
- Organization-scoped member pages preserve organization route scope.
- Invite modal supports scoped org/workspace payloads and filters platform roles away from scoped org flows.
- Member detail uses active `role_assignments` as source of truth and labels `user_roles` as backward compatibility only.
- Add/remove role actions call `/role-assignments` APIs, not direct permission assignment.
- Mutations invalidate member lists, global member role assignments, roles, permissions, context version, platform context, and member page authority queries.
- View/mutate controls use permission-code gates such as `settings.member.invite`, `settings.member.remove`, and `settings.member.manage` / role manage action helpers.

Frontend change in this pass: none.

## Audit / Activity Coverage

| Action | Activity status |
|---|---|
| Invite sent | audited as `member.invited` |
| Invite accepted | audited as `member.invitation_accepted` |
| Invitation cancelled | audited as `member.invitation_cancelled` |
| Invitation resent | audited as `member.invitation_resent` |
| Organization member removed | audited as `member.removed` |
| Workspace member removed | audited as `member.removed` |
| Project member added/changed/removed | audited as `project.member_added`, `project.member_changed`, `project.member_removed` |
| Team member changed/removed | audited as `team.member_changed`, `team.member_removed` |
| Role assigned | audited as `role.assigned` |
| Role assignment revoked | audited as `role.revoked` |
| Descendant bulk revocation | covered by parent `member.removed`; individual descendant assignment IDs are not separately logged |

Known audit gap: descendant role revocations caused by org/workspace member removal are bulk-updated and do not emit one activity row per revoked descendant assignment.

## Tests Added

`services/core-service/tests/test_member_role_lifecycle_certification.py`

Coverage:

- unauthenticated member/invite/role-assignment operations rejected
- role assignment list reads are scoped by `settings.role.view`
- member without manage permissions cannot assign/remove roles
- existing-user org invite creates membership and role assignment
- duplicate invite/add behavior is safe
- re-invite after org member removal works
- assigning the same role twice returns conflict
- assigning platform/Superuser roles without platform authority is rejected
- Superuser self-removal guard blocks direct self role revocation
- multiple roles union permissions
- removing one role leaves remaining role permissions
- removing all ordinary scoped roles removes scoped membership/access with no fallback role
- workspace member removal revokes descendant project access while preserving unrelated org access
- organization member removal revokes descendant workspace/project assignments while preserving unrelated scope assignments
- effective permissions and access version change after assignment/removal
- role assignment reads do not mutate assignment counts
- role assigned/revoked activity coverage exists

## Validation

Attempted:

- `cd services/core-service && pytest tests/test_member_role_lifecycle_certification.py -vv` blocked because `pytest` is not installed in the local Python environment.

Fallback passed:

- In-memory Python syntax compile passed for `app/services/scoped_membership_service.py`.
- In-memory Python syntax compile passed for `tests/test_member_role_lifecycle_certification.py`.

## Known Gaps

- Project member removal inactivates `project_memberships` but does not revoke separate project-scoped `role_assignments`; future product work should decide whether project membership is the only project access path or whether project member removal should also revoke matching project role assignments.
- Organization/workspace member removal bulk-revokes descendant role assignments without individual descendant audit events.
- No dedicated member archive/restore lifecycle exists for organization/workspace members; removal is delete/deactivate semantics depending scope.
- Last owner/admin rules are partly protected through membership owner checks and platform protected-role checks, but comprehensive multi-owner policy still needs product certification.
- No role conflict visualization exists in UI for users with multiple roles.
- No formal access review workflow exists yet.
- Some legacy services still import `UserRole` for backward compatibility/protected role checks; no new access logic was added using `user_roles` in this pass.

## Manual QA Checklist

1. Login as Superuser/Platform Owner.
2. Open org member settings.
3. Invite/add a test user to organization.
4. Assign Organization Member role.
5. Confirm user can see org-level allowed pages.
6. Add second role with additional permission.
7. Confirm permission union works.
8. Remove second role.
9. Confirm only second-role permissions are removed.
10. Remove last org role.
11. Confirm user loses org scoped access.
12. Confirm no fallback role is assigned.
13. Add workspace role to user.
14. Remove user from workspace.
15. Confirm project descendant access is revoked if applicable.
16. Remove user from org.
17. Confirm workspace/project descendant roles are revoked.
18. Confirm unrelated org access remains.
19. Confirm member list/detail refreshes after every mutation.
20. Confirm view-only user cannot invite/assign/remove.
21. Confirm notifications/audit logs if supported.
22. Confirm no role/permission changed outside intended scope.

## Go / No-Go Criteria

Go for continued Core certification when:

- Targeted member/role lifecycle tests pass in a dependency-complete environment.
- Browser QA confirms member invite/add/remove and role assignment/removal refresh without hard reload.
- Browser QA confirms last-role removal does not silently assign fallback access.
- Browser QA confirms descendant revocation behavior is accepted.
- Known gaps are accepted or scheduled.

No-go if:

- Any active user can list or mutate unrelated role assignments.
- Removing a role/member leaves effective access behind unintentionally.
- Removing last ordinary scoped role creates fallback access.
- Member/role lifecycle changes mutate unrelated scopes.
- Frontend member pages show stale role/permission state after mutations.
