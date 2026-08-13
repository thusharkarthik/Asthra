# Local Development Reset

Core service includes a guarded local reset script for QA.

Run inside the core-service container:

```bash
docker compose exec core-service python scripts/reset_local_data.py --yes
```

The script removes local operational data:

- users
- organizations
- workspaces
- projects
- teams
- memberships
- role assignments
- invitations
- notifications
- audit/activity logs
- API keys
- core dashboard summaries

The script keeps and reseeds:

- schema
- migrations
- permission catalog
- permission registry metadata
- system role templates
- role-permission mappings

Safety:

- requires `--yes`
- refuses to run when `ENVIRONMENT` is `production` or `prod`

After reset, registering the first user bootstraps that account as Superuser and Platform Owner.

The reset command prints verification counts:

- users deleted
- role assignments deleted
- organization/workspace/project/team records deleted
- roles kept or reseeded
- permissions kept or reseeded
- role-permission mappings kept or reseeded
- post-reset counts for users, role assignments, organizations, workspaces, projects, and teams

For first-user bootstrap QA, the important post-reset values are:

```text
users=0
role_assignments=0
organizations=0
workspaces=0
projects=0
teams=0
```

Roles, permissions, and role-permission mappings should remain present after reset.
