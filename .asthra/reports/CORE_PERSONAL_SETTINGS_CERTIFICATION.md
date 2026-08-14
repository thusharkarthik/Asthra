# Core Personal Settings Certification

Date: 2026-08-15
Status: Certification coverage added; runtime QA still required in the local app.

## Scope

Certified the Core-owned personal settings surfaces:

- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `POST /api/v1/me/change-password`
- `POST /api/v1/me/deactivate`
- `GET /api/v1/auth/me` read model consistency
- Settings Profile and Account frontend pages
- Settings Preferences/Notifications/Security current frontend state

This pass did not change RBAC, navigation, God Mode, bottom bar, feature flags, or org/workspace/project settings behavior.

## Flow Found

Backend personal settings are implemented through `app/api/v1/me.py` and `UserService`:

- Profile read/update is always for `current_user`.
- Profile updates accept only `full_name`, `avatar_url`, `job_title`, `timezone`, and `locale`.
- Email, password hash, activation state, superuser flag, and role assignments are not accepted through profile PATCH.
- Password change requires the current password, validates minimum password length, rejects reusing the same password, and returns 204 without sensitive data.
- Account deactivation affects only the current user and blocks deactivation of the only active superuser.
- Personal profile/password/deactivation operations do not mutate `role_assignments`.
- Profile and password actions write compact activity records without storing password values.

Frontend personal settings are currently split as:

- `/settings/profile`: profile fields, locale/timezone, role assignment display, auth-store update after profile PATCH.
- `/settings/account`: account summary, password change, self-deactivation with confirmation and logout.
- `/settings/preferences`: local theme and local notification preference toggles.
- `/settings/notifications`: placeholder page.
- `/settings/security`: placeholder page.

## Ownership And Isolation

Certified behavior:

- Personal endpoints require authentication.
- `/me` routes are not scoped to organization/workspace/project and do not depend on bottom-bar context.
- A user can update only their own profile through `/me`.
- Unrelated user profile reads through `/users/{id}` remain blocked unless existing directory-sharing rules allow them.
- Sensitive backend fields are not returned in personal read/update responses.
- Role assignments remain unchanged by profile, password, and deactivation operations.

## Tests Added

`services/core-service/tests/test_personal_settings_certification.py`

Covers:

- unauthenticated personal endpoint rejection
- no-org self profile read/update
- blocked privilege/sensitive field injection through profile PATCH
- self-only profile mutation
- current-password and password validation rules
- old credential rejection and new credential login after password change
- password values absent from activity descriptions
- role assignment count unchanged by personal profile/password/deactivation actions
- unrelated profile read denied through user detail route
- self-deactivation blocks future access/login
- only active superuser cannot self-deactivate

## Known Gaps

- Preferences are local browser settings today; there is no Core preference registry/user-preferences API yet.
- Notification delivery preferences are not persisted server-side yet.
- Security/session management is a placeholder; there is no session list/revoke-device API yet.
- Email address change is intentionally unsupported in the current UI/API.
- Avatar upload is intentionally unavailable; profile only supports an `avatar_url` field.

## Manual QA Checklist

1. Login as a normal user.
2. Open Settings -> Profile.
3. Update name, job title, timezone, and language; confirm the shell/user menu updates without hard reload.
4. Confirm email is read-only.
5. Open Settings -> Account.
6. Attempt password change with wrong current password; confirm error.
7. Change password successfully; logout and confirm old password fails and new password works.
8. Test Deactivate Account confirmation; confirm logout and inactive-login rejection in a disposable account.
9. Confirm Preferences theme toggle still works locally.
10. Confirm Notifications and Security placeholder pages render without claiming server-backed controls.

## Certification Result

Personal Profile and Account backend behavior is safe for current Phase C Core expectations. Preferences, Notifications delivery preferences, and Security/session management remain future product work rather than certified server-backed settings.
