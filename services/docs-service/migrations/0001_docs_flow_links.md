# 0001 Docs Flow Links

This service currently uses SQLAlchemy `create_all` plus startup-safe `ALTER TABLE`
checks instead of Alembic.

Schema additions:

- `doc_flow_links`
- `pages.discover_idea_id`

The table creation is handled by `Base.metadata.create_all()` and existing SQLite
databases receive the nullable Page column in `app/main.py`.
