# First User Superuser Bootstrap

When core-service starts with an empty user table, the first registered account becomes the recovery account for the local platform.

Bootstrap behavior:

- the first user is created with `is_superuser = true`
- the role catalog is seeded before assignment
- the user receives the hidden `Superuser` role at platform scope
- the user receives the `Platform Owner` role at platform scope
- both legacy platform user-role and scoped role-assignment records are created for compatibility

Later registered users follow the normal registration flow and are not superusers.

## Superuser

`Superuser` is a hidden system role for platform recovery.

Rules:

- `scope = platform`
- `is_system = true`
- `is_editable = false`
- `is_hidden = true`
- bypasses permission checks through `User.is_superuser`
- visible only to Superuser and Platform Owner users
- hidden from normal role lists, invite role dropdowns, and assignment dropdowns

The last Superuser cannot be removed through role assignment or legacy user-role removal.

## Platform Owner

`Platform Owner` is the business-level owner role. It is visible and can manage platform-level access control. The last Platform Owner is protected from removal.

## Local QA Flow

1. Reset local data.
2. Register the first account.
3. Confirm `/api/v1/me/permissions` includes `superuser` and `platform_owner` roles.
4. Create organization, workspace, project, and team from the UI.
