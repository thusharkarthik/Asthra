# Architectural Decisions

## 2026-06-30 — All Alembic Migrations Must Use Idempotency Helpers for create_table / create_index

**Decision**: Every migration that calls `op.create_table(...)` or `op.create_index(...)` MUST wrap the call with a `table_exists` or `index_exists` guard from `app.db.migration_utils`. No exceptions.

**Why**: SQLite dev databases routinely drift ahead of `alembic_version` (due to `create_all()`, partial runs, or Docker volume reuse). Without guards, a single drifted migration causes an unrecoverable crash-loop on every container startup. This pattern hit twice (0013, 0014) within three weeks.

**How to apply**:
```python
from app.db.migration_utils import table_exists, index_exists

def upgrade() -> None:
    if not table_exists("my_table"):
        op.create_table("my_table", ...)
    if not index_exists("my_table", op.f("ix_my_table_id")):
        op.create_index(op.f("ix_my_table_id"), "my_table", ["id"], unique=False)
```
The helper lives at `services/core-service/app/db/migration_utils.py`. The `app` package is always on sys.path when alembic runs. `column_exists` is also available for `batch_alter_table` guards. Note: alembic/versions/ is baked into the Docker image, so migration changes require `docker compose build core-service`.

## 2026-06-30 — Feature Flags Are Availability Gates, RBAC Remains Usage Authority

**Decision**: Feature flags decide whether a module/capability is available for a platform or organization scope. RBAC permissions continue to decide whether a specific user can use that available capability.

**Why**: Availability and authorization are different concerns. Example: `module.discover.enabled=false` for an organization means nobody should see or use Discover there. If it is enabled, users still need Discover permissions from scoped roles before they can act. Keeping these layers separate avoids encoding product rollout state into roles.

**How to apply**: Use `FeatureFlagService.is_feature_enabled(...)` or effective flags for availability. Use `AccessControlService.require(...)` / frontend `can("permission.code")` for user action access. Do not replace permission checks with feature flags.

## 2026-06-30 — Feature Flag v1 Scope Precedence

**Decision**: Effective feature flags resolve in this order: default catalog value, platform override, organization override. Workspace and project scope fields are modeled now but are not required for v1 workflows.

**Why**: Platform defaults give predictable behavior. Platform overrides allow local/global rollout control. Organization overrides support customer/org-specific rollout without introducing Module Registry or billing logic yet. Workspace/project support is represented in the data model so the resolver can grow without a schema redesign.

**How to apply**: Inactive flags always resolve `false`. Unknown/missing flags should be treated as disabled by consumers. Do not add rollout percentages or billing plan checks until a later phase explicitly introduces them.

## 2026-06-30 — Initial Feature Flag Defaults Preserve Current Core Product Expectations

**Decision**: Flow, Docs, Discover, Memory, and Assistant module flags default enabled. Desk, Pulse, Collab, Automation, Connect, Insights, and Phase B beta flags default disabled.

**Why**: Flow/Docs/Discover are already active product workflows and should not disappear after adding flags. Memory and Assistant already have navigation/shell affordances. Other modules are less central to the current QA path and can be enabled deliberately by override later. Beta Phase B features should stay hidden until each foundation is implemented.

**How to apply**: Do not change sidebar/module visibility in this pass. Future Module Registry work should combine `feature_flags` availability with `can("module.resource.view")` permission checks.

## 2026-06-29 — Profile/Account Pages Implemented Directly in Page Files, Not in settings-admin-views.tsx

**Decision**: Profile, Account, and Preferences pages are self-contained in their respective `page.tsx` files rather than as exported components in `settings-admin-views.tsx`.

**Why**: `settings-admin-views.tsx` is already very large (3600+ lines) and hosts admin-facing views. Profile/Account/Preferences are personal user pages — they don't need org/workspace context, don't use admin permission guards, and have no business being alongside `RoleDetailView` or `MembersView`. Keeping them in page files makes them easier to find, test, and replace without scrolling 4000 lines.

**How to apply**: Any future personal settings pages (notifications, API keys personal view, etc.) should follow the same pattern — implement directly in the page file. Admin management views (org detail, member detail, role detail) belong in `settings-admin-views.tsx`.

## 2026-06-29 — Auth Store Updated via setState After Profile PATCH

**Decision**: After a successful `PATCH /me`, the auth store's `currentUser` is updated using `useAuthStore.setState((state) => ({ ...state, currentUser: updatedUser }))` rather than calling `loadCurrentUser()` or adding a new store action.

**Why**: `loadCurrentUser()` makes an extra network round-trip to `GET /auth/me`. The PATCH response already returns the full updated `UserProfileRead` which has all `CoreUser` fields. Direct `setState` is instant and avoids a second request. Adding a dedicated `updateCurrentUser` action to the store would require touching the auth store for what is a one-off concern.

**How to apply**: Use `useAuthStore.setState((state) => ({ ...state, currentUser: updated }))` in any mutation that returns an updated user. Only call `loadCurrentUser()` when you genuinely need a fresh server state (e.g., after login, or in a paranoid consistency check).

## 2026-06-28 — Platform-Led Onboarding: Owner Assigned Directly, No Email

**Decision**: `POST /organizations/platform-onboard` creates an org AND assigns the owner in one atomic transaction. Owner is an existing user identified by `owner_user_id`. No email invite flow is used.

**Why**: In dev environments the email service is not ready. Platform admins know the target user (they're already registered) and need to provision orgs instantly without a separate invitation/acceptance round-trip. The owner gets a Notification in-app and has `organization_owner` RoleAssignment immediately — no pending state.

**How to apply**: When email service is ready, a future variant can send an email notification as well. The endpoint does not touch the invitation system, so it's safe to extend without breaking invitations.

## 2026-06-28 — OrganizationRead.owner_name: Set as Dynamic Attribute on SQLAlchemy Model

**Decision**: `owner_name: str | None = None` is added to `OrganizationRead` Pydantic schema. It's populated by setting `org.owner_name = "..."` directly on the SQLAlchemy model instance in the service, before serialization. Pydantic `model_validate(..., from_attributes=True)` picks it up via `getattr`.

**Why**: Adding a JOIN to the ORM model or creating a separate response class would require touching shared schemas or complex repository changes. Setting attributes on SQLAlchemy model instances is safe in Python — instances are regular objects. The `from_attributes` mode reads via `getattr`, so any dynamically set attribute is included.

**How to apply**: `owner_name` defaults to `None` in `OrganizationRead`. Any endpoint that doesn't call `_attach_owner_names()` will just return `None`. The batch query in `_attach_owner_names()` runs once per `list()` call using `.in_(org_ids)` to avoid N+1.

## 2026-06-28 — Skipped-Onboarding Shell State Lives in the Shell, Not a Store

**Decision**: `skippedOnboarding` state is a React `useState` in `AsthraShell`, not a Zustand store or URL param. The motivational home page independently detects "no-org" state (`organizations.length === 0 && !is_superuser`) rather than reading skip state.

**Why**: Skip state is session-local and intentionally ephemeral — if the user refreshes, they see the onboarding gate again (encouraging org creation). Persisting it in a store or localStorage would undermine this intent. The home page detecting "no-org" independently is correct because by the time a user reaches `/`, they've either: (a) come from the OnboardingGate skip link, or (b) somehow have no org on a direct load — both should show motivational content.

**How to apply**: If skip state ever needs persistence (e.g., to survive page refresh), use sessionStorage or a Zustand store with reset-on-logout. Do not use localStorage.

## 2026-06-28 — Invite Modal Role Scoping: Platform Roles Hidden from Org Context

**Decision**: `groupedInviteModalRoles` (IIFE-computed) replaces `groupedAllRoles` in the invite dialog. Filters by `role.scope === "platform"` for global directory, and `role.scope !== "platform"` for org/workspace context.

**Why**: Platform roles (Platform Owner, Admin, Support) should never appear in org-level invite flows — an org admin cannot grant platform roles. Conversely, global directory invites (superuser/platform admin context) should only show platform roles since they have no org scope to assign non-platform roles to.

**How to apply**: If new role scopes are added, the invite modal filter logic in `groupedInviteModalRoles` may need updating. The `groupedRolesForInvite` function (used for the "Change role" dialog) already filters correctly and doesn't need changing.

## 2026-06-28 — Self-Serve Onboarding Gate: Organizations List + Platform Roles as Access Signal

**Decision**: Onboarding gate condition uses `organizations.length === 0 && !is_superuser && hasPlatformRole === false` rather than fetching a separate role-assignments list.

**Why**: The `organizationsQuery` is already in-flight from `platformContext` so there's no extra network request. Platform-scope `/me/permissions` already runs at platform scope for unauthenticated users (no org selected), so `permissions?.roles` at that scope accurately captures platform-level assignments. Org/workspace/project-scope assignments are correctly proxied by the organizations list (you can't have a workspace role without belonging to an org's membership structure). The edge case (workspace-only without org membership) is too uncommon to warrant a dedicated `/me/role-assignments` query.

**How to apply**: Gate logic in `asthra-shell.tsx` — no new queries needed. To expand scope check in future, add a `/me/role-assignments` query or check a new field on the user object.

## 2026-06-28 — Role-Permission Sync Is Now Additive Only; Manual Assignments Are Permanent Truth

**Decision**: `_sync_role_template_permissions()` no longer deletes any existing `RolePermission` rows. It only adds permissions that match template patterns but are absent from the DB. Manual permission assignments made via the admin UI persist permanently across restarts and syncs.

**Why**: The previous destructive behavior wiped manual role-permission assignments on every `ensure_role_catalog()` call. The RBAC lifecycle intention is: template patterns are the *starting point* for seeding initial permissions, not an enforced constraint that must be maintained forever. Once an admin assigns a permission to a role, that is the living truth. Sync should only bring in *new* permissions added by new services — it must never remove what an admin deliberately put there (or kept absent).

**How to apply**: When adding new permissions via `REGISTRY_DEFINITIONS` in `permission_registry.py`, they will be auto-seeded onto matching roles the next time the admin clicks "Sync Permissions" or on server restart. Existing role-permission data is never touched by sync. If a permission needs to be removed from a role, an admin must explicitly uncheck it in the role detail UI.

**Call frequency change**: `ensure_role_catalog()` with `sync_permissions=True` now only runs: (a) first-user registration (in `auth_service.py`), (b) server startup (in `access_control_bootstrap.py`, already used `sync_permissions=False`), (c) explicit admin "Sync Permissions" button (`POST /permission-registry/sync`). Normal API calls (`list roles`, `list templates`, `/me/permissions`) use `sync_permissions=False` to avoid triggering the expensive `sync_registry_permissions()` on every request. The additive-only role-permission sync (`_sync_role_template_permissions`) still runs on those calls (via `ensure_role_catalog(sync_permissions=False)`) to ensure roles stay seeded, but since it never deletes, it is safe and cheap.

**Admin sync trigger**: `POST /permission-registry/sync` now does both: (1) syncs the permission catalog (creates/updates permissions from `REGISTRY_DEFINITIONS`), then (2) calls `ensure_role_catalog(sync_permissions=False)` to seed any newly-created permissions onto roles matching template patterns.

---

## 2026-06-27 — Functional Roles Deactivated; Role Permission Editing Unlocked

**Decision 1 — Deactivate Functional Roles**: Functional roles (scrum_master, product_owner, engineering_manager, release_manager, incident_commander, knowledge_manager) are job title labels masquerading as permission roles. They have been set to `is_active: False` in `ASTHRA_ROLE_TEMPLATES` so they are deactivated on every `ensure_role_catalog()` call. They are NOT deleted — permission mappings preserved. Plan to replace with a Labels system in Phase B.

**Decision 2 — Role Permission Editing for Elevated Users**: Superuser and Platform Owner can now add/remove permissions from any system role via the role detail page. Implementation: `_can_manage_role_permissions(user, role)` helper bypasses the `is_editable=False` guard in `link_permission()` and `unlink_permission()`. The Superuser role itself is permanently locked (no one can edit it). Platform Admin can only edit non-system roles — unchanged behavior.

**Why not change is_editable on system roles**: `is_editable` guards the role's name/scope/description fields too. Changing it would allow renaming system roles. The bypass lives only in the permission link/unlink methods so the role definition stays protected.

**Phase B Labels plan**: When Labels system ships, functional roles can be deleted or migrated. Deactivating rather than deleting preserves the assignment history and permission mappings.

---

## 2026-06-27 — platform_member Retired; organization_member Added

**Decision**: Remove `platform_member` (platform-scoped) from the role catalog. Add `organization_member` (organization-scoped) as the base org membership role.

**Rationale for removing platform_member**: The role was a temporary fallback for invited users before the "authenticated, no org" onboarding state was implemented. It served no architectural purpose once the platform invite flow was reworked. Keeping it created confusion in role dropdowns — users would see a platform role that doesn't grant any meaningful access.

**Rationale for adding organization_member**: A base org-level role was missing for users who belong to an org but have not yet been assigned to a workspace. This fills the hierarchy gap between "has no role" and "Organization Auditor". It grants minimal visibility (profile, notifications, preferences, org view) without allowing any management or workspace access.

**Implementation**:
- Removed from `ASTHRA_ROLE_TEMPLATES` in `role_service.py`
- `ensure_role_catalog()` now deactivates `platform_member` in DB on first call after deploy (sets `is_active = False`, does not delete)
- `organization_member` added to `ASTHRA_ROLE_TEMPLATES` after `organization_auditor`
- Frontend: removed `platformMemberRole` variable and its use as the default invite role; updated info card text; `is_active !== false` filter in `groupedAllRoles` automatically excludes the now-inactive platform_member

---

## 2026-06-26 — user_roles Fully Retired; role_assignments is Sole Source of Truth

**Decision**: `user_roles` table is fully retired — nothing writes to it, nothing reads from it. `role_assignments` is the exclusive authority for all role information across all scopes.

**Changes (branch: fix/remove-user-roles)**:
- `auth_service._assign_first_user_platform_roles()`: writes only to `RoleAssignment`, not `UserRole`
- `role_service.assign_user_role()`: returns `RoleAssignment` instead of `UserRole`, raises 409 on duplicate (no silent refresh), no `user_roles` write
- `access_control_service._resolve_roles()`: removed `UserRole` loop entirely; reads from `role_assignments` + legacy membership role fields
- `invitation_repository.add_memberships()`: writes `RoleAssignment` after membership creation; no `role_id` written to `OrganizationMember`/`WorkspaceMember`
- `users.py`: removed `POST/GET/DELETE /users/{id}/roles` endpoints — use `/role-assignments` instead
- `Invitation.organization_id`: nullable for platform-scope invites; `invitation_service` routes to `_assign_platform_role()` when `organization_id is None`

**Constraint**: `user_roles` table is NOT dropped (data is preserved). Production DB needs a migration for `invitations.organization_id` nullable change.

---

## 2026-06-26 — role_assignments is Primary Write Path; user_roles is Backward-Compat Only

**Decision**: `POST /users/{id}/roles` now dual-writes to both `user_roles` (for backward compat) and `role_assignments` (primary, scoped). `role_assignments` is the authoritative source of truth for scoped role data.

**Rationale**: The `user_roles` table is unscoped — unique on `(user_id, role_id)` only. It cannot represent the same role assigned at multiple scopes (e.g., workspace_admin at workspace 1 AND workspace 2). `role_assignments` has `(user_id, role_id, scope_type, scope_id)` uniqueness and supports this naturally.

**Constraints (Phase A)**:
- `user_roles` table is NOT dropped. Still written to for backward compat with any code reading from it.
- `_resolve_roles()` in `access_control_service.py` now only applies `user_roles` entries where `role.scope == "platform"`. Non-platform roles get their correct scope from `role_assignments`.
- Phase B (future): consolidation pass to stop writing to `user_roles` entirely and migrate read paths to `role_assignments` exclusively.

**`platform_member` role** added to `ASTHRA_ROLE_TEMPLATES`: minimal platform-scoped role for newly invited users (settings.profile.view, settings.notifications.view, settings.preferences.view). Default selection in invite modal.

---

## 2026-06-25 — Settings Members Page: Authority-Based Scope

**Decision**: `/settings/members` derives scope from the logged-in user's own roles, not from the bottom bar.

**Rationale**: The bottom bar reflects the user's current navigation context (which workspace they're working in), not their administrative authority. An org admin who has their bottom bar set to a workspace should still see org-scoped members when managing members, not workspace-scoped members. Tying the admin page to navigation state creates a confusing, fragile UX where the page content changes silently when the user switches workspaces.

**Implementation**: Three `useQuery` calls in `page.tsx` (disabled for superusers) — platform-scope permissions, user's active role assignments, and roles list. Cross-reference role IDs to keys to determine authority tier.

**Alternatives rejected**:
- Using `useCurrentPermissions` hook with `null` override — doesn't work; hook falls back to store selections.
- Fetching org-scope permissions for each org — requires knowing which orgs to query first.
- Relying on `UserRole` table for org/workspace authority — `UserRole` is unscoped and only used for platform roles.

## 2026-06-25 — scopeOrganizationId: No Silent Fallback

**Decision**: Remove `organizations[0]?.id` fallback from `scopeOrganizationId` in `MembersView`. Use `null` instead.

**Rationale**: The fallback silently selected the wrong organization when multiple orgs exist or when the user is in global directory mode. The existing `!scopeOrganizationId` guard in `submitInvite` is the correct safety net — the fallback was defeating it.

## 2026-06-26 — rbac.ts Check Functions Removed; can() Is Now Sole Frontend Access Control

**Decision**: Deleted `lib/rbac.ts` Category B functions (`hasAtLeastRole`, `canView`, `canManageMembers`, `canManageRoles`, `canManageProjects`, `canEditWork`, `canManagePlatform`, `canManageOrganization`, `canManageWorkspace`, `canManageProject`, `canManageTeam`, `canInviteMembers`, `canViewAudit`). Renamed file to `lib/role-utils.ts` containing only display/sorting utilities (`normalizeRole`, `roleRank`, `ROLE_RANK`, `RoleName`, `RoleContext`).

**Rationale**: The Category B functions use role-name/rank comparisons for access control decisions. This contradicts Asthra's permission-code system (`can()` from `platformContext.tsx` via `lib/permissions.ts`). Having two systems causes confusion about which to use for new code, and the role-rank approach can't express the granular action-level permissions the backend enforces. `can()` is the correct mechanism.

**Outcome**: `lib/rbac.ts` no longer exists. `lib/role-utils.ts` is the file for display/sorting only. `can()` from `usePlatformContext()` (or the `useCan()` hook) is the sole frontend access control mechanism.

**Investigation finding**: None of the Category B functions were actually imported or called outside `rbac.ts` itself. The one consumer (`settings-admin-views.tsx`) only imported `normalizeRole` (Category A), so no call-site replacements were needed.

## 2026-06-29 — Three-Mode Navigation: Role-Based, Not Route-Based

**Decision**: Navigation mode is derived from the user's highest authority role (platform > org > work), not from the current URL. Superusers additionally get route-based auto-detection and a manual override switcher.

**Why**: Role-based detection means a user always sees the nav that matches what they can actually do — an org admin never sees the work module list as their primary nav just because they happen to be on `/flow`. Route-based auto-detection for superusers is an ergonomic addition: since superusers access all three contexts, they want the nav to reflect where they are, not just their maximum authority.

**How to apply**: `detectNavigationMode(isSuperuser, roles)` in `navigation-mode.ts` is the single source of truth. Roles are from `permissions?.roles` (the current-scope permission resolution). If a new role scope is added, add its keys to the appropriate set in `navigation-mode.ts`. Never derive mode from the URL for regular users.

**`nav-items.ts` retained**: `command-palette.tsx` and `app/page.tsx` quick-launch still consume the original `navSections` / `navItems` exports. These are not replaced — they serve a different purpose (command search, quick launch grid). The sidebar is the only consumer that switched to mode-based sections.

---

## 2026-06-29 — accept_in_app: Skip Email Token When User Already Authenticated

**Decision**: Added `POST /invitations/{id}/accept-in-app` that accepts an invitation without the email token.

**Why**: Standard `POST /invitations/{id}/accept` requires `InvitationAccept { token: str }` from the email link. Storing the token in the notification payload would be a security leak. Since the user is already authenticated, the token check is redundant — email match (`current_user.email == invitation.email`) is still enforced to prevent accepting someone else's invite.

**How to apply**: Use `accept_in_app` from authenticated UI contexts (notification center). Email link flow still uses standard `accept()`. Never skip the email match check.

---

## 2026-06-29 — RequestAccessButton Exported from settings/layout.tsx

**Decision**: `RequestAccessButton` is an exported component from `app/settings/layout.tsx` rather than its own file.

**Why**: Only used in 3 places within settings routes; small enough to coexist with `SettingsAuthorityContext` in the same file. Creating a new file adds indirection for minimal gain.

**How to apply**: `import { RequestAccessButton } from "@/app/settings/layout"`. Extract to its own file only if the component grows or is needed outside settings.

---

## 2026-06-29 — Audit Log Action Naming Convention Standardized

**Decision**: All audit log actions follow `{entity}.{verb}` format. Verbs are past-tense, lowercase, underscore-separated for multi-word. Entity prefix determines color-coding in the audit log UI.

**Full action list**:
- `organization.created`, `organization.updated`, `organization.deactivated`, `organization.reactivated`, `platform.org_onboarded`
- `workspace.created`, `workspace.updated`, `workspace.archived`, `workspace.restored`
- `project.created`, `project.updated`, `project.archived`, `project.restored`
- `team.created`, `team.updated`, `team.deleted`
- `member.invited`, `member.invitation_accepted`, `member.invitation_cancelled`, `member.invitation_resent`, `member.added`, `member.removed`
- `role.created`, `role.assigned`, `role.updated`, `role.deleted`
- `permission.assigned`, `permission.removed`
- `user.profile_updated`, `user.password_changed`, `user.deactivated`

**Why**: Previously invitation actions used `invitation.*` prefix (inconsistent with the user-facing concept of "member management"). Standardizing on the user-facing entity (`member.*`) makes the audit log filterable in a way that matches how admins think about actions.

**How to apply**: When adding new audit logs, always use `{entity}.{verb}`, pick the entity name from the user's perspective (not the internal model name), and include actor name in description.

## 2026-06-29 — Permission Simulator: UI-Only Simulation, No Impersonation

**Decision**: Permission Simulator only overrides the frontend `can()` function. Real token is always used for API calls. No backend session changes. No actual permission mutations.

**Why**: Impersonation at the API level would require passing a user-id header or token swap, which creates security risks and audit trail problems. UI-only simulation is sufficient for the primary use case: debugging what a role sees without creating test accounts.

**How**: `useSimulationStore` (Zustand) holds `isSimulating`, `simulatedPermissions`, `simulatedMode`. `PlatformContextProvider` subscribes to the store and overrides `can()` when simulating. `effectiveNavigationMode` in shell applies the simulated navigation mode to sidebar and bottom bar.

**Access control**: Backend `GET /access-control/simulate` enforces superuser OR platform_owner/platform_admin. Frontend "View As" button checks the same roles client-side for visibility.

**"View As This User" in member detail NOT implemented**: The spec mentions adding a button in `/settings/members/[id]` but the task explicitly excludes settings pages from scope. The backend endpoint already supports `user_id` param; the frontend only needs to call `simulatePermissions(token, { user_id })` when that button is wired up.

## 2026-06-29 — Unified Platform Context API: Single Endpoint Replaces 5 Separate Calls

**Decision**: Replace 5 separate context queries (user, organizations, workspaces, projects, permissions) in `PlatformContextProvider` with a single `GET /context/platform` endpoint. Version polling (`GET /context/version` every 60s) kept separate as a lightweight background signal.

**Why**: Startup latency — 5 parallel requests fire in the first render. Unified endpoint resolves all context server-side in one DB connection, returns in one round-trip. Version polling stays lean (small response) and triggers unified refetch when data changes.

**How to apply**: 
- New context data goes into `GET /context/platform` response schema (`context_version.py`)
- `platformContext.tsx` is the single consumer; all downstream `usePlatformContext()` callers unchanged
- When version polling detects a change, invalidate `queryKeys.platformContext.all`
- `useClearContextCache()` in `use-smart-context-cache.ts` must also clear `platformContext.all`

## 2026-06-30 — Module Registry: Core Owns Module Metadata, Sidebar Filtering Deferred

**Decision**: Core owns the Module Registry metadata: module key, label, route, icon key, navigation mode, required feature flag, required permissions, and sort order. Unified Platform Context includes resolved modules for the current user/context.

**Separation of concerns**:
- Module Registry = what modules exist and how they should appear.
- Feature Flags = whether the module/capability is available for the current scope.
- RBAC Permissions = whether the current user can access/use it.

**Resolution rule**: A module is visible only when it is active, matches the requested navigation mode, its required feature flag is enabled, and the user has at least one required permission. Backend superuser bypass is honored through `User.is_superuser`, matching existing permission resolver behavior.

**Frontend strategy**: Frontend platform context exposes `availableModules` and `hasModule(moduleKey)` safely, but sidebar filtering remains deferred. This avoids accidentally hiding all navigation if a deployment has not yet migrated/seeded module registry data or if dynamic nav needs QA.

**How to apply**: Add new modules to `services/core-service/app/services/module_registry.py` defaults and wire their feature flag and permission codes there. Do not duplicate module metadata in unrelated services. Dynamic sidebar filtering should be a separate, tested pass.

## 2026-06-30 — AI Context Registry: Structured Context Only, No AI Execution

**Decision**: AI Context Registry v1 is a Core-owned structured context assembly layer. It returns deterministic context blocks and lightweight platform-context metadata, but it does not call an LLM, create embeddings, build RAG, or introduce Assistant UI.

**Why**: Asthra Assistant should eventually start with platform-aware context, but model execution and retrieval pipelines are separate concerns. Keeping v1 as structured context makes the data contract testable, permission-aware, and safe before any AI provider is introduced.

**Context contract**:
- Full context lives behind `GET /api/v1/ai/context`.
- Registry metadata lives behind `GET /api/v1/ai/context/registry`.
- Unified Platform Context includes only lightweight `ai_context` metadata: availability, endpoint, block count, categories, and source modules.

**Access rule**: Context blocks must only include data the authenticated user can already access. V1 contributors are Core-owned and compact: identity, scope, access, feature flags, modules, notifications, recent activity, and onboarding.

**How to apply**: Future module contributors should add compact context blocks through the registry contract instead of embedding large records or cross-service private data. Do not add external AI calls inside Core context resolution.

## 2026-06-30 — Configuration Registry: Behavior Settings, Not Availability or Authorization

**Decision**: Configuration Registry owns behavior settings for enabled features/modules. Feature Flags remain the availability layer, and RBAC permissions remain the user authority layer.

**Why**: These are separate questions. A module can be available for an organization, a user can be authorized to use it, and the module can still need scoped behavior settings such as default sprint length, Docs space visibility, or Assistant context limits. Keeping configuration separate prevents roles and feature flags from becoming overloaded with product behavior.

**Inheritance rule**: Effective configuration resolves from definition default, then platform value, organization value, workspace value, and project value. The most specific scoped value wins. Inactive definitions are omitted from effective responses, and secret values are redacted unless an internal caller explicitly requests secrets.

**Platform context contract**: Unified Platform Context includes only lightweight configuration metadata: availability, endpoint, definition count, categories, source modules, and supported inheritance order. Full effective configuration is fetched separately through `/api/v1/configuration/effective`.

**How to apply**: Add future module settings as definitions in the Core Configuration Registry or through a future module contribution contract. Do not create per-module ad hoc settings tables unless the setting is operational domain data rather than configuration.

## 2026-06-30 — Global Search Registry: Search Contract First, Simple Execution Only

**Decision**: Global Search Registry v1 defines searchable entity metadata and executes simple Core-owned search providers. It does not add embeddings, vector search, fuzzy ranking, an external search service, or a CMD+K UI.

**Why**: The first platform need is a safe, typed contract for universal search: which entity types exist, which module owns them, which permissions protect them, and which route opens a result. Advanced ranking and cross-service indexing can be layered later without changing the frontend result shape.

**Access rule**: Search providers must filter by backend permissions and scope before returning results. When access behavior is uncertain, providers should skip results rather than risk leaking data. Result metadata must stay compact and must not include secrets.

**Platform context contract**: Unified Platform Context includes only lightweight `search` metadata: availability, endpoint, registry endpoint, categories, entity types, and shortcut. Search results are fetched separately through `/api/v1/search`.

**How to apply**: Future module search providers should register searchable entity metadata and return the same stable result shape: id, entity_type, source_module, title, subtitle, description, route, icon, category, scope, matched_fields, score, and compact metadata.

## 2026-07-01 — Organization Templates: Core-Owned Preview/Apply, No Cross-Service Execution

**Decision**: Organization Templates v1 is code-defined and Core-owned. It creates only Core structures (workspaces, projects, teams) and applies Core-controlled feature flag overrides and configuration values. It does not create Flow work items, Docs pages, Desk queues, Pulse incidents, or other service-owned records.

**Why**: Templates need to make onboarding useful without duplicating ownership boundaries or forcing cross-service orchestration before those services expose template contributor contracts. Keeping v1 in Core preserves service ownership and keeps apply behavior testable.

**Preview/apply split**: Preview returns the exact action report without mutating data. Apply uses the same action model, creates missing records, skips existing records by name within the same scope, and never deletes or overwrites unrelated data.

**Authorization**: Preview requires `settings.organization_templates.view` at organization scope. Apply requires `settings.organization_templates.apply`; feature flag and configuration writes continue through their existing services and permission checks.

**Platform context contract**: Unified Platform Context includes only lightweight `organization_templates` metadata: availability, endpoint, template count, and categories. Full template catalog and reports are fetched through `/api/v1/organization-templates`.

**How to apply**: Future template work should add module-specific actions through explicit contributor contracts instead of directly writing another service's data from Core.
