# Core API Keys Certification

Date: 2026-08-14

## Purpose

This report certifies the current Core API Keys system before other Asthra services or integrations depend on machine access.

API keys are security-sensitive credentials. Raw secrets must be shown only once, must not be stored in plaintext, must not appear in list/detail responses, and must not grant roles or permissions.

## Current API Key Architecture

Backend-owned files:
- `services/core-service/app/models/api_key.py`
- `services/core-service/app/schemas/api_key.py`
- `services/core-service/app/repositories/api_key_repository.py`
- `services/core-service/app/services/api_key_service.py`
- `services/core-service/app/api/v1/api_keys.py`

Model fields:
- `user_id`
- optional `organization_id`, `workspace_id`
- `name`
- `key_prefix`
- `hashed_key`
- `scopes`
- `is_active`
- `last_used_at`
- `expires_at`
- timestamp mixin fields `created_at`, `updated_at`

Key generation:
- Raw key format: `ak_` + `secrets.token_urlsafe(32)`.
- Prefix: first 12 characters of the raw key.
- Stored secret: `sha256(raw_key).hexdigest()` in `hashed_key`.
- The raw key is returned only by the create response as `api_key`.

## Backend API Behavior

Endpoints:
- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys`
- `GET /api/v1/api-keys/{api_key_id}`
- `PATCH /api/v1/api-keys/{api_key_id}`
- `POST /api/v1/api-keys/{api_key_id}/revoke`
- `DELETE /api/v1/api-keys/{api_key_id}`

Authentication:
- All endpoints require a JWT bearer token.

Ownership and scope:
- API keys are personal owner-scoped records.
- List returns only keys where `api_keys.user_id == current_user.id`.
- Detail, update, revoke, and delete resolve through `get_for_user(...)`, so unrelated users receive 404.
- Optional organization/workspace metadata can be attached to a key at creation.
- Organization-scoped keys require active organization access by superuser, creator, or membership.
- Workspace-scoped keys require active workspace access by superuser, creator, or workspace membership.
- Workspace plus organization payloads must match parentage.

Permission model:
- There is no `settings.api_keys.*` RBAC permission today.
- The current product model treats API Keys as personal authenticated settings, not delegated admin management.
- Navigation/module registry currently exposes API Keys as authenticated/personal utility metadata with no required permission.

## Secret Redaction Behavior

Certified behavior:
- Create response includes raw `api_key` once.
- List response uses `APIKeyRead` and does not include `api_key` or `hashed_key`.
- Detail response uses `APIKeyRead` and does not include `api_key` or `hashed_key`.
- Stored database value is a SHA-256 hash, not the raw key.
- Audit events do not include the raw key in description or metadata.

## Revoke / Delete Behavior

Certified behavior:
- `POST /api-keys/{id}/revoke` sets `is_active=false`.
- Repeating revoke is safe and leaves the key inactive.
- `DELETE /api-keys/{id}` deletes only the current user's key.
- Unrelated users cannot revoke or delete another user's key.

Hardened in this certification:
- `PATCH /api-keys/{id}` now rejects `is_active=true` so revoked keys cannot be reactivated. Users must create a new key instead.

## Validation / Machine Authentication Status

Known gap:
- Core does not currently implement API-key authentication or validation middleware.
- No active-key lookup, expired-key rejection, last-used update, or scope enforcement exists for API-key request authentication yet.
- Because validation is not implemented, this certification does not claim that API keys can authenticate machine requests.

Future validation requirements:
- Validate prefix + SHA-256 hash using constant-time comparison where practical.
- Reject inactive/revoked keys.
- Reject expired keys.
- Update `last_used_at` on successful validation.
- Map key owner and scope into a machine principal without granting more permissions than the owner/scope allows.
- Audit key use and failed validation without logging secrets.

## Frontend UI Behavior

Frontend-owned files inspected:
- `frontend/src/app/settings/api-keys/page.tsx`
- `frontend/src/services/api/settings-api.ts`
- `frontend/src/types/core.ts`
- `frontend/src/components/settings/settings-admin-views.tsx`
- `frontend/src/lib/permission-schema.ts`
- `frontend/src/lib/navigation-mode.ts`

Settings page behavior:
- Route: `/settings/api-keys`
- API client methods: `listApiKeys`, `createApiKey`, `revokeApiKey`
- Query key: `["settings", "api-keys"]`
- Empty, loading, error, table, create dialog, one-time reveal modal, copy action, and revoke confirmation states exist.
- The raw key is stored only in component state as `revealedKey` after creation and is cleared when the one-time modal closes.
- Close is disabled until the user copies/checks that the key was saved.
- List table displays only name, key prefix, scopes, created/expires/last-used metadata, status, and revoke action.

No frontend code changes were required in this certification pass.

## Audit / Activity Behavior

API key producer coverage:
- `api_key.created` on create
- `api_key.updated` on update
- `api_key.revoked` on revoke
- `api_key.deleted` on delete

Certified safety:
- Activity descriptions include key name/id context only.
- Raw API key secret is not written to audit description or metadata.
- API key list/detail reads do not create audit events.
- API key create/revoke/delete do not mutate role assignments or permissions.

Known gaps:
- API key use/validation is not implemented, so successful/failed key use audit events do not exist yet.

## Test Matrix

Backend fixture added:

`services/core-service/tests/test_api_keys_certification.py`

| Area | Coverage |
|---|---|
| Auth required | Unauthenticated list/create/detail/revoke/delete rejected. |
| Creation metadata | Create returns expected owner/name/scope/prefix/created metadata. |
| Secret safety | Raw secret returned once, stored hashed, and redacted from list/detail/audit. |
| Owner isolation | Users see only own keys and cannot detail/revoke/delete another user's keys. |
| Scope safety | Organization scope requires access; workspace/org mismatch is rejected. |
| Revoke safety | Revoke marks inactive, repeated revoke stays inactive, and reactivation is rejected. |
| Delete safety | Delete removes only own key. |
| RBAC safety | Create/list/revoke/delete do not mutate role assignment count. |
| Audit safety | Create/revoke/delete activity events exist and do not include raw secrets. |

## Manual QA Checklist

1. Login as Superuser/Platform Owner or normal authenticated user.
2. Open Settings -> API Keys.
3. Confirm empty state or current key list loads.
4. Create an API key.
5. Confirm the raw key is shown once.
6. Copy the key and close the reveal modal.
7. Confirm the list shows only prefix and metadata, not raw key.
8. Refresh the page and confirm raw key is not shown again.
9. Revoke the key.
10. Confirm status changes to revoked and revoke action disappears.
11. Confirm no secret appears in Settings -> Audit Logs for the create/revoke event.
12. Confirm another user cannot see the key in their API Keys page.

## Known Gaps

- No API-key authentication/validation middleware exists yet.
- `last_used_at` is modeled but not updated because validation is not implemented.
- Expiry is modeled and displayed, but not enforced by a key-auth path yet.
- Scopes are stored as labels but not enforced for machine requests yet.
- No admin UI/API exists for platform staff to inspect all API keys across users.
- No API key rotation flow beyond creating a new key and revoking/deleting the old one.
- No per-key usage audit events or failed-validation audit events exist yet.
- API key management is personal/authenticated, not controlled by a dedicated `settings.api_keys.*` permission.

## Go / No-Go Criteria

Go for continued Core certification when:
- Backend tests pass in a dependency-complete environment.
- Manual QA confirms one-time secret display and list/detail redaction.
- Manual QA confirms revoked keys remain inactive.
- Manual QA confirms unrelated users cannot see or mutate each other's keys.
- No raw key appears in audit logs.

No-go for external integration rollout if:
- Machine-auth validation is needed before implementation.
- Raw keys appear outside the create response.
- Revoked keys can become active again.
- API key actions mutate roles or permissions.
