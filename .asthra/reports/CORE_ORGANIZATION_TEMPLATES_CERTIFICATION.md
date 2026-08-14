# Core Organization Templates Certification

Date: 2026-08-15

## Scope

This certification audits Core Organization Templates v1 across backend registry, API, frontend consumption, preview/apply behavior, feature flag and configuration integration, platform context metadata, and audit activity coverage.

It does not add a full template UI, does not create Flow/Docs/Desk records, does not change live sidebar behavior, does not change RBAC permissions, and does not reintroduce `user_roles`.

## Flow Found

Backend registry flow:
- `OrganizationTemplateService` owns a code-defined catalog for `startup`, `software_team`, `healthcare`, `support_desk`, `agency`, and `enterprise_it`.
- Templates describe Core-owned structures only: workspaces, projects, teams, feature flag overrides, configuration values, recommended modules, notes, and next steps.
- `get_template_metadata()` returns compact metadata for Unified Platform Context without embedding full template definitions.

API flow:
- `GET /api/v1/organization-templates` returns the template catalog.
- `GET /api/v1/organization-templates/{template_key}` returns template detail.
- `POST /api/v1/organization-templates/{template_key}/preview` returns a non-mutating action report.
- `POST /api/v1/organization-templates/{template_key}/apply` mutates only the target organization and returns an action report.
- Catalog/detail reads now support optional `organization_id` and enforce `settings.organization_templates.view` at platform scope by default or organization scope when supplied.
- Preview requires `settings.organization_templates.view` on the target organization.
- Apply requires `settings.organization_templates.apply` on the target organization.

Frontend flow:
- Organization detail loads the template catalog through the Settings API client.
- The catalog query now includes the route organization id, so organization owners/admins can read templates with organization-scoped permission instead of requiring platform scope.
- `/settings/organization-templates` is the discoverable Settings entry point for template catalog inspection, preview, and apply. It supports platform users and organization-scoped owners/admins by resolving permissions for the selected organization.
- Apply success invalidates the organization-scoped template query, organization/workspace/project/team caches, platform context, context version, and related settings queries.

## Access-Control Fix

Issue found during certification: catalog and detail endpoints authenticated the user but did not enforce `settings.organization_templates.view`. This meant template metadata was visible to any authenticated user if they called the catalog/detail routes directly.

Fix applied:
- Added `OrganizationTemplateService.get_template_catalog_for_user(...)`.
- Added `OrganizationTemplateService.get_template_detail_for_user(...)`.
- Added `_require_template_view(...)`, which checks platform scope when no organization id is supplied and organization scope when `organization_id` is supplied.
- Updated catalog/detail routes to call the user-aware service methods.
- Updated frontend organization detail query to pass the route organization id.

## Preview Behavior

Certified expected behavior:
- Preview does not mutate workspaces, projects, teams, feature flag overrides, configuration values, roles, permissions, or activity logs.
- Preview reports pending actions for missing Core records.
- Preview reports `skipped_existing` actions for matching records already present in the same target scope.
- Preview remains target-organization scoped.

## Apply Behavior

Certified expected behavior:
- Apply creates missing Core workspaces under the target organization.
- Apply creates missing Core projects under the intended workspace.
- Apply creates missing Core teams where Core team support exists.
- Apply skips existing workspaces/projects/teams by name within the same scope.
- Re-applying the same template is idempotent and conservative.
- Apply does not delete or overwrite unrelated records.
- Apply does not create Flow, Docs, Desk, Pulse, or other cross-service module records.

## Feature Flag And Configuration Integration

Certified expected behavior:
- Apply uses Feature Flag service behavior to set organization-scoped overrides for template-defined flags.
- Apply uses Configuration Registry service behavior to set organization-scoped configuration values.
- Default feature flag and configuration definitions remain unchanged.
- Overrides are scoped to the target organization and do not affect unrelated organizations.
- Existing service-level permission and context-version behavior remains the source of truth.

## Context And Cache Behavior

Certified expected behavior:
- Unified Platform Context includes compact `organization_templates` metadata.
- Organization-scoped role assignments, including Organization Admin, make the assigned organization and descendant workspaces/projects visible through platform context and list APIs without granting platform access.
- Applying templates creates Core records visible through organization/workspace/project routes after refetch.
- Feature flag/configuration service integration can bump context version through their existing services.
- Frontend invalidation refreshes organization-scoped template data after apply.

## Audit / Activity Coverage

Confirmed activity producer coverage:
- `organization.template_applied` is emitted by Organization Template apply.
- Delegated Core services emit `workspace.created`, `project.created`, and `team.created` for created structures.

Known producer gaps:
- Feature flag override application and configuration value application are not individually audited by this template certification beyond their service behavior and context updates.
- There is no template preview audit event, which is acceptable because preview is read-only.

## Tests Added

Added `services/core-service/tests/test_organization_templates_certification.py` covering:
- unauthenticated catalog/detail/preview/apply rejection
- catalog/detail permission scoping
- organization owner own-org view/apply
- unrelated organization denial
- no-access user denial
- catalog keys and unknown template 404
- preview non-mutation and skip reporting
- idempotent apply for Core workspaces/projects/teams
- target organization isolation
- organization-scoped feature flag overrides
- organization-scoped configuration values
- platform context template metadata
- route/context version resource visibility
- Organization Admin assigned-org descendant visibility and org-scoped template access
- no role assignment or `user_roles` mutation
- activity coverage for template apply and delegated create actions

## Known Gaps

- No full template builder/editor UI exists.
- No rollback, apply history UI, or template versioning exists.
- Preview is exposed on `/settings/organization-templates`, but not as a multi-step wizard or saved dry-run workflow.
- Conflict detection is name-based and conservative.
- No cross-service template execution is performed in v1.
- Browser manual QA is still required in a running app.

## Manual QA Checklist

1. Login as Superuser/Platform Owner.
2. Create or open an organization.
3. Open the organization detail/settings page.
4. Confirm template catalog data loads for the organization-scoped route.
5. Apply `software_team`.
6. Confirm Engineering/Product workspaces are created.
7. Confirm Platform/Frontend/Backend/Mobile/Product Discovery projects are created under intended workspaces.
8. Confirm Backend/Frontend/QA teams are created where defined.
9. Apply the same template again.
10. Confirm no duplicate workspaces/projects/teams appear.
11. Apply `support_desk` to a separate organization.
12. Confirm Desk-related feature flag/configuration overrides are scoped only to that organization.
13. Login as a user without template permissions.
14. Confirm catalog/apply actions are denied.
15. Confirm platform context still loads and includes `organization_templates` metadata.
16. Confirm no Flow/Docs/Desk records are created directly by templates.

## Certification Status

Organization Templates v1 is certified by code audit and targeted test coverage. UI discoverability was added through `/settings/organization-templates`; Organization Admin descendant resource visibility was fixed so org-scoped admins can select their assigned organization and use org-scoped template access. Browser QA must confirm the route, selected-org catalog, preview, and apply flow. Local pytest and frontend type validation were unavailable in this shell because `pytest` and `frontend/node_modules` are not installed; Python syntax compile passed for changed backend files and tests.
