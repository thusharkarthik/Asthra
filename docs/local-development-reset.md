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
