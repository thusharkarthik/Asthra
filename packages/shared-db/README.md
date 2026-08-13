# Asthra Shared DB

`packages/shared-db` contains lightweight database utilities for Asthra services.

It provides SQLAlchemy engine/session helpers, health checks, generic model mixins, and shared type aliases. It does not contain business models. Each service continues to own its own models and migrations.

## Test

```bash
python -m pytest tests -q
```
